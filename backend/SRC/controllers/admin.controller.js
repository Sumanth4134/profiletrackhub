const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pool = require('../config/db');
const { NOTIFICATION_TYPES, createNotification } = require('../services/notification.service');
const { ensureCandidateResumePreview, removeResumePreviewFile } = require('../services/resumePreview.service');
const { generatePublicSlug } = require('../utils/auth');
const { getUploadPathFromUrl } = require('../utils/upload-paths');

const DEFAULT_APPLICATION_NAME = 'ProfileTrackHub';

function buildJobPublicUrl(req, job) {
  if (job?.public_slug) {
    return `${req.protocol}://${req.get('host')}/jobs/${job.public_slug}`;
  }

  return `${req.protocol}://${req.get('host')}/apply?jobId=${job.id}`;
}

function normalizeJobPayload(req, { requireAll = true } = {}) {
  const vacancies = Number.parseInt(req.body.vacancies, 10);
  const payload = {
    applicationName: DEFAULT_APPLICATION_NAME,
    companyName: req.body.companyName?.trim() || DEFAULT_APPLICATION_NAME,
    logoUrl: '',
    jobTitle: req.body.jobTitle?.trim() || '',
    jobRole: req.body.jobRole?.trim() || 'General',
    location: req.body.location?.trim() || '',
    salary: req.body.salary?.trim() || '',
    jobType: req.body.jobType?.trim() || '',
    vacancies: Number.isInteger(vacancies) && vacancies >= 0 ? vacancies : NaN,
    skills: req.body.skills?.trim() || '',
    experience: req.body.experience?.trim() || '',
    jobDescription: req.body.jobDescription?.trim() || '',
    status: req.body.status === 'Inactive' ? 'Inactive' : 'Active'
  };

  if (requireAll && (!payload.jobTitle || !payload.location || Number.isNaN(payload.vacancies))) {
    return null;
  }

  return payload;
}

function buildProfileFilters(query, adminId, { includeAdminName = false, startIndex = 2 } = {}) {
  const values = [adminId];
  const conditions = ['c.admin_id = $1'];
  let index = startIndex;

  if (query.name) {
    values.push(`%${query.name}%`);
    conditions.push(`c.full_name ILIKE $${index++}`);
  }

  if (query.job_title) {
    values.push(`%${query.job_title}%`);
    conditions.push(`c.job_title ILIKE $${index++}`);
  }

  if (query.experience) {
    values.push(`%${query.experience}%`);
    conditions.push(`c.experience::text ILIKE $${index++}`);
  }

  if (query.status) {
    values.push(query.status);
    conditions.push(`c.status = $${index++}`);
  }

  const adminJoin = includeAdminName
    ? 'LEFT JOIN admins a ON a.id = c.admin_id'
    : '';
  const adminSelect = includeAdminName
    ? ', a.name AS admin_name, a.phone AS admin_phone'
    : '';

  return {
    values,
    whereClause: conditions.join(' AND '),
    adminJoin,
    adminSelect,
    nextIndex: index
  };
}

async function fetchDashboardCounts(adminId) {
  const [jobsResult, profilesResult, helpResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total_jobs,
         COUNT(*) FILTER (WHERE status = 'Active')::int AS active_jobs,
         COUNT(*) FILTER (WHERE status = 'Inactive')::int AS inactive_jobs
       FROM jobs
       WHERE admin_id = $1`,
      [adminId]
    ),
    pool.query(
      `SELECT
         COUNT(*)::int AS total_profiles,
         COUNT(*)::int AS total_applications,
         COUNT(DISTINCT COALESCE(NULLIF(LOWER(TRIM(email)), ''), NULLIF(phone, ''), id::text))::int AS total_candidate_profiles,
         COUNT(*) FILTER (WHERE status = 'Shortlisted')::int AS shortlisted_profiles,
         COUNT(*) FILTER (WHERE status = 'Interview Process')::int AS interview_profiles,
         COUNT(*) FILTER (WHERE status = 'Selected')::int AS selected_profiles
       FROM candidates
       WHERE admin_id = $1`,
      [adminId]
    ),
    pool.query(
      `SELECT
         COUNT(*)::int AS total_help_requests,
         COUNT(*) FILTER (WHERE status = 'New')::int AS new_help_requests
       FROM help_requests
       WHERE admin_id = $1`,
      [adminId]
    )
  ]);

  return {
    ...jobsResult.rows[0],
    ...profilesResult.rows[0],
    ...helpResult.rows[0]
  };
}

exports.getAdminDashboard = async (req, res) => {
  try {
    const counts = await fetchDashboardCounts(req.user.id);

    const [recentJobs, recentProfiles, recentHelpRequests] = await Promise.all([
      pool.query(
        `SELECT id, job_title, location, vacancies, status, public_slug, created_at
         , COALESCE(NULLIF(TRIM(job_role), ''), 'General') AS job_role
         FROM jobs
         WHERE admin_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [req.user.id]
      ),
      pool.query(
        `SELECT id, full_name, job_title, status, created_at
         , COALESCE(NULLIF(TRIM(job_role), ''), 'General') AS job_role
         FROM candidates
         WHERE admin_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [req.user.id]
      ),
      pool.query(
        `SELECT id, request_type, subject, status, created_at
         FROM help_requests
         WHERE admin_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [req.user.id]
      )
    ]);

    res.json({
      counts,
      recentJobs: recentJobs.rows,
      recentProfiles: recentProfiles.rows,
      recentHelpRequests: recentHelpRequests.rows
    });
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

exports.getAdminJobs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         admin_id,
         application_name,
         company_name,
         logo_url,
         job_title,
         COALESCE(NULLIF(TRIM(job_role), ''), 'General') AS job_role,
         location,
         vacancies,
         salary,
         job_type,
         skills,
         experience,
         job_description,
         public_slug,
         public_token,
         status,
         created_at,
         updated_at
       FROM jobs
       WHERE admin_id = $1
       ORDER BY updated_at DESC, id DESC`,
      [req.user.id]
    );

    let applicationCountMap = new Map();

    try {
      const countsResult = await pool.query(
        `SELECT job_id, COUNT(*)::int AS applications_count
         FROM candidates
         WHERE admin_id = $1 AND job_id IS NOT NULL
         GROUP BY job_id`,
        [req.user.id]
      );

      applicationCountMap = new Map(
        countsResult.rows.map((row) => [String(row.job_id), row.applications_count])
      );
    } catch (countError) {
      console.warn('getAdminJobs count fallback:', countError.message);
    }

    const jobs = result.rows.map((job) => ({
      ...job,
      applications_count: applicationCountMap.get(String(job.id)) || 0,
      public_url: buildJobPublicUrl(req, job)
    }));

    res.json(jobs);
  } catch (error) {
    console.error('getAdminJobs error:', error);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
};

exports.createJob = async (req, res) => {
  try {
    const payload = normalizeJobPayload(req);

    if (!payload) {
      return res.status(400).json({ error: 'Job title, location, and vacancies are required' });
    }

    const publicSlug = generatePublicSlug(payload.jobTitle);
    const publicToken = crypto.randomBytes(12).toString('hex');

    const result = await pool.query(
      `INSERT INTO jobs (
        admin_id,
        application_name,
        company_name,
        logo_url,
        job_title,
        job_role,
        location,
        salary,
        job_type,
        vacancies,
        skills,
        experience,
        job_description,
        public_slug,
        public_token,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        req.user.id,
        payload.applicationName,
        payload.companyName,
        payload.logoUrl,
        payload.jobTitle,
        payload.jobRole,
        payload.location,
        payload.salary,
        payload.jobType,
        payload.vacancies,
        payload.skills,
        payload.experience,
        payload.jobDescription,
        publicSlug,
        publicToken,
        payload.status
      ]
    );

    await createNotification({
      userId: req.user.id,
      roleScope: 'ADMIN',
      actorId: req.user.id,
      title: 'New job created',
      message: `${payload.jobTitle} was created and is now available in your jobs list.`,
      type: NOTIFICATION_TYPES.JOB_CREATED,
      entityType: 'job',
      entityId: result.rows[0].id
    });

    res.status(201).json({
      ...result.rows[0],
      public_url: buildJobPublicUrl(req, result.rows[0])
    });
  } catch (error) {
    console.error('createJob error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const existingResult = await pool.query(
      `SELECT * FROM jobs WHERE id = $1 AND admin_id = $2`,
      [req.params.id, req.user.id]
    );
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const payload = normalizeJobPayload(req, { requireAll: false });

    const result = await pool.query(
      `UPDATE jobs
       SET application_name = $1,
           company_name = $2,
           logo_url = $3,
           job_title = $4,
           job_role = $5,
           location = $6,
           salary = $7,
           job_type = $8,
           vacancies = $9,
           skills = $10,
           experience = $11,
           job_description = $12,
           status = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND admin_id = $15
       RETURNING *`,
      [
        payload.applicationName || existing.application_name,
        payload.companyName || existing.company_name,
        payload.logoUrl || existing.logo_url,
        payload.jobTitle || existing.job_title,
        payload.jobRole || existing.job_role || 'General',
        payload.location || existing.location,
        payload.salary || existing.salary || '',
        payload.jobType || existing.job_type || '',
        Number.isNaN(payload.vacancies) ? existing.vacancies : payload.vacancies,
        payload.skills || existing.skills,
        payload.experience || existing.experience,
        payload.jobDescription || existing.job_description,
        payload.status || existing.status,
        req.params.id,
        req.user.id
      ]
    );

    await createNotification({
      userId: req.user.id,
      roleScope: 'ADMIN',
      actorId: req.user.id,
      title: 'Job updated',
      message: `${result.rows[0].job_title} was updated successfully.`,
      type: NOTIFICATION_TYPES.JOB_UPDATED,
      entityType: 'job',
      entityId: result.rows[0].id
    });

    res.json({
      ...result.rows[0],
      public_url: buildJobPublicUrl(req, result.rows[0])
    });
  } catch (error) {
    console.error('updateJob error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const existing = await pool.query(
      `SELECT id, job_title, logo_url FROM jobs WHERE id = $1 AND admin_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = existing.rows[0];

    if (job.logo_url?.startsWith('/uploads/logos/')) {
      const logoPath = getUploadPathFromUrl(job.logo_url);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    await pool.query(`DELETE FROM jobs WHERE id = $1 AND admin_id = $2`, [req.params.id, req.user.id]);

    await createNotification({
      userId: req.user.id,
      roleScope: 'ADMIN',
      actorId: req.user.id,
      title: 'Job deleted',
      message: `${job.job_title} was deleted from your jobs list.`,
      type: NOTIFICATION_TYPES.JOB_DELETED,
      entityType: 'job',
      entityId: Number.parseInt(req.params.id, 10) || null
    });

    res.json({ success: true });
  } catch (error) {
    console.error('deleteJob error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

exports.getAdminProfiles = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.max(Number.parseInt(req.query.pageSize || '10', 10), 1);
    const offset = (page - 1) * pageSize;
    const filterConfig = buildProfileFilters(req.query, req.user.id);

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT c.*
         FROM candidates c
         WHERE ${filterConfig.whereClause}
         ORDER BY c.created_at DESC, c.id DESC
         LIMIT $${filterConfig.nextIndex} OFFSET $${filterConfig.nextIndex + 1}`,
        [...filterConfig.values, pageSize, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM candidates c
         WHERE ${filterConfig.whereClause}`,
        filterConfig.values
      )
    ]);

    res.json({
      data: dataResult.rows,
      total: countResult.rows[0]?.total || 0,
      page,
      pageSize
    });
  } catch (error) {
    console.error('getAdminProfiles error:', error);
    res.status(500).json({ error: 'Failed to load profiles' });
  }
};

exports.getAdminProfileById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM candidates WHERE id = $1 AND admin_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const candidate = await ensureCandidateResumePreview(result.rows[0]);
    res.json(candidate);
  } catch (error) {
    console.error('getAdminProfileById error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

exports.updateAdminProfileStatus = async (req, res) => {
  try {
    const previousResult = await pool.query(
      `SELECT id, full_name, status FROM candidates WHERE id = $1 AND admin_id = $2`,
      [req.params.id, req.user.id]
    );
    const previous = previousResult.rows[0];

    if (!previous) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const result = await pool.query(
      `UPDATE candidates
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND admin_id = $3
       RETURNING *`,
      [req.body.status, req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await createNotification({
      userId: req.user.id,
      roleScope: 'ADMIN',
      actorId: req.user.id,
      title: 'Candidate status updated',
      message: `${result.rows[0].full_name} moved from ${previous.status} to ${result.rows[0].status}.`,
      type: NOTIFICATION_TYPES.CANDIDATE_STATUS_UPDATED,
      entityType: 'candidate',
      entityId: result.rows[0].id
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('updateAdminProfileStatus error:', error);
    res.status(500).json({ error: 'Failed to update profile status' });
  }
};

exports.deleteAdminProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM candidates WHERE id = $1 AND admin_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const candidate = result.rows[0];

    if (candidate.resume_url) {
      const resumePath = getUploadPathFromUrl(candidate.resume_url);
      if (fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
    }

    removeResumePreviewFile(candidate.resume_preview_url);

    if (candidate.extra_file) {
      const extraFilePath = getUploadPathFromUrl(candidate.extra_file);
      if (fs.existsSync(extraFilePath)) {
        fs.unlinkSync(extraFilePath);
      }
    }

    await pool.query(`DELETE FROM candidates WHERE id = $1 AND admin_id = $2`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteAdminProfile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
};

exports.exportAdminProfilesExcel = async (req, res) => {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const filterConfig = buildProfileFilters(req.query, req.user.id);
    const result = await pool.query(
      `SELECT c.*
       FROM candidates c
       WHERE ${filterConfig.whereClause}
       ORDER BY c.created_at DESC, c.id DESC`,
      filterConfig.values
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Profiles');

    sheet.columns = [
      { header: 'Name', key: 'full_name' },
      { header: 'Job Title', key: 'job_title' },
      { header: 'Job Role', key: 'job_role' },
      { header: 'Phone', key: 'phone' },
      { header: 'Email', key: 'email' },
      { header: 'Experience', key: 'experience' },
      { header: 'Location', key: 'location' },
      { header: 'Status', key: 'status' },
      { header: 'Work Preference', key: 'work_preference' },
      { header: 'LinkedIn', key: 'linkedin_url' }
    ];

    result.rows.forEach((row) => sheet.addRow(row));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=admin-profiles.xlsx');

    await createNotification({
      userId: req.user.id,
      roleScope: 'ADMIN',
      actorId: req.user.id,
      title: 'Export completed',
      message: `Profiles export completed successfully in Excel format with ${result.rows.length} record(s).`,
      type: NOTIFICATION_TYPES.EXPORT_SUCCESS,
      entityType: 'export'
    });

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('exportAdminProfilesExcel error:', error);
    await createNotification({
      userId: req.user?.id || null,
      roleScope: 'ADMIN',
      actorId: req.user?.id || null,
      title: 'Export failed',
      message: 'Profiles export to Excel could not be completed.',
      type: NOTIFICATION_TYPES.EXPORT_FAILED,
      entityType: 'export'
    });
    res.status(500).json({ error: 'Failed to export profiles' });
  }
};

exports.exportAdminProfilesCsv = async (req, res) => {
  try {
    const json2csv = await import('json2csv');
    const filterConfig = buildProfileFilters(req.query, req.user.id);
    const result = await pool.query(
      `SELECT c.*
       FROM candidates c
       WHERE ${filterConfig.whereClause}
       ORDER BY c.created_at DESC, c.id DESC`,
      filterConfig.values
    );

    const Parser = json2csv.Parser || json2csv.default?.Parser || json2csv.default;
    const parser = new Parser();
    const csv = parser.parse(result.rows);

    await createNotification({
      userId: req.user.id,
      roleScope: 'ADMIN',
      actorId: req.user.id,
      title: 'Export completed',
      message: `Profiles export completed successfully in CSV format with ${result.rows.length} record(s).`,
      type: NOTIFICATION_TYPES.EXPORT_SUCCESS,
      entityType: 'export'
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('admin-profiles.csv');
    res.send(csv);
  } catch (error) {
    console.error('exportAdminProfilesCsv error:', error);
    await createNotification({
      userId: req.user?.id || null,
      roleScope: 'ADMIN',
      actorId: req.user?.id || null,
      title: 'Export failed',
      message: 'Profiles export to CSV could not be completed.',
      type: NOTIFICATION_TYPES.EXPORT_FAILED,
      entityType: 'export'
    });
    res.status(500).json({ error: 'Failed to export profiles as CSV' });
  }
};

exports.fetchDashboardCounts = fetchDashboardCounts;
