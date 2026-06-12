const pool = require('../config/db');
const { NOTIFICATION_TYPES, createNotification } = require('../services/notification.service');
const { ensureCandidateResumePreview, generateResumePreview } = require('../services/resumePreview.service');

const validAdPages = new Set(['recruiter_dashboard', 'public_jobs']);

exports.getActiveAds = async (req, res) => {
  try {
    const requestedPage = validAdPages.has(req.query.page) ? req.query.page : 'public_jobs';
    const result = await pool.query(
      `SELECT id, title, description, image_url, link_url, target_page, status, start_date, end_date
       FROM ads
       WHERE status = 'Active'
         AND CURRENT_DATE BETWEEN start_date AND end_date
         AND target_page IN ($1, 'both')
       ORDER BY start_date DESC, id DESC`,
      [requestedPage]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('getActiveAds error:', error);
    res.status(500).json({ error: 'Failed to load ads' });
  }
};

exports.getPublicJobs = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, admin_id, application_name, company_name, logo_url, job_title,
              COALESCE(NULLIF(TRIM(job_role), ''), 'General') AS job_role,
              location, salary, job_type, vacancies,
              skills, experience, job_description, public_slug, status, created_at, updated_at
       FROM jobs
       WHERE status = 'Active'
       ORDER BY updated_at DESC, id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('getPublicJobs error:', error);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
};

exports.getPublicJobRoles = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         jr.role_name,
         COUNT(j.id)::int AS job_count
       FROM job_roles jr
       LEFT JOIN jobs j
         ON LOWER(COALESCE(NULLIF(TRIM(j.job_role), ''), 'General')) = LOWER(jr.role_name)
        AND j.status = 'Active'
       GROUP BY jr.role_name
       HAVING COUNT(j.id) > 0
       ORDER BY job_count DESC, jr.role_name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('getPublicJobRoles error:', error);
    res.status(500).json({ error: 'Failed to load public job roles' });
  }
};

exports.getPublicJobsByRole = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, admin_id, application_name, company_name, logo_url, job_title,
              COALESCE(NULLIF(TRIM(job_role), ''), 'General') AS job_role,
              location, salary, job_type, vacancies,
              skills, experience, job_description, public_slug, status, created_at, updated_at
       FROM jobs
       WHERE status = 'Active'
         AND LOWER(COALESCE(NULLIF(TRIM(job_role), ''), 'General')) = LOWER($1)
       ORDER BY updated_at DESC, id DESC`,
      [decodeURIComponent(req.params.roleName)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('getPublicJobsByRole error:', error);
    res.status(500).json({ error: 'Failed to load jobs for selected role' });
  }
};

exports.getPublicJobById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, admin_id, application_name, company_name, logo_url, job_title,
              COALESCE(NULLIF(TRIM(job_role), ''), 'General') AS job_role,
              location, salary, job_type, vacancies,
              skills, experience, job_description, public_slug, status, created_at, updated_at
       FROM jobs
       WHERE id = $1 AND status = 'Active'`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('getPublicJobById error:', error);
    res.status(500).json({ error: 'Failed to load job' });
  }
};

exports.getPublicJobBySlug = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, admin_id, application_name, company_name, logo_url, job_title,
              COALESCE(NULLIF(TRIM(job_role), ''), 'General') AS job_role,
              location, salary, job_type, vacancies,
              skills, experience, job_description, public_slug, status, created_at, updated_at
       FROM jobs
       WHERE public_slug = $1 AND status = 'Active'`,
      [req.params.slug]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('getPublicJobBySlug error:', error);
    res.status(500).json({ error: 'Failed to load public job' });
  }
};

exports.applyToPublicJob = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      skills,
      experience,
      location,
      preferred_role,
      source,
      hybrid,
      relocate,
      contract_type,
      job_title,
      job_role,
      linkedin_url,
      visa,
      job_description
    } = req.body;
    const workPreferenceValue = hybrid || '';
    const legacyHybridValue = /(^|,\s*)Hybrid(\s*,|$)/i.test(workPreferenceValue);
    const legacyRelocateValue = /(^|,\s*)Local(\s*,|$)/i.test(workPreferenceValue);

    if (!full_name || !email || !phone || !linkedin_url) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const jobResult = await pool.query(
      `SELECT id, admin_id, job_title,
              COALESCE(NULLIF(TRIM(job_role), ''), 'General') AS job_role,
              location, job_description, status
       FROM jobs
       WHERE public_slug = $1`,
      [req.params.slug]
    );

    const job = jobResult.rows[0];

    if (!job || job.status !== 'Active') {
      return res.status(404).json({ error: 'Job not found' });
    }

    const resume = req.files?.resume?.[0]?.filename
      ? `/uploads/${req.files.resume[0].filename}`
      : null;
    const extraFile = req.files?.extra_file?.[0]?.filename
      ? `/uploads/${req.files.extra_file[0].filename}`
      : null;
    const resumePreviewUrl = await generateResumePreview(resume);

    if (!resume) {
      return res.status(400).json({ error: 'Resume is required' });
    }

    const result = await pool.query(
      `INSERT INTO candidates (
        full_name,
        email,
        phone,
        skills,
        experience,
        location,
        preferred_role,
        source,
        hybrid,
        relocate,
        resume_url,
        resume_preview_url,
        extra_file,
        job_id,
        admin_id,
        job_title,
        job_role,
        linkedin_url,
        job_description,
        job_location,
        work_preference,
        contract_type,
        visa,
        status,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
      )
      RETURNING *`,
      [
        full_name,
        email,
        phone,
        skills || '',
        experience || null,
        location || '',
        preferred_role || job.job_title,
        source || 'Public Job Link',
        legacyHybridValue,
        relocate === 'true' ? true : legacyRelocateValue,
        resume,
        resumePreviewUrl,
        extraFile,
        job.id,
        job.admin_id,
        job_title || job.job_title,
        job_role || job.job_role || 'General',
        linkedin_url || '',
        job_description || job.job_description || '',
        job.location || '',
        workPreferenceValue,
        contract_type || '',
        visa || '',
        'New'
      ]
    );

    const candidateWithPreview = await ensureCandidateResumePreview(result.rows[0]);

    await Promise.all([
      createNotification({
        userId: job.admin_id,
        roleScope: 'ADMIN',
        title: 'New candidate application',
        message: `${full_name} applied for ${job.job_title}.`,
        type: NOTIFICATION_TYPES.APPLICATION_CREATED,
        entityType: 'candidate',
        entityId: result.rows[0].id
      }),
      createNotification({
        userId: job.admin_id,
        roleScope: 'ADMIN',
        title: 'Resume uploaded',
        message: `${full_name} uploaded a resume for ${job.job_title}.`,
        type: NOTIFICATION_TYPES.RESUME_UPLOADED,
        entityType: 'candidate',
        entityId: result.rows[0].id
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: candidateWithPreview
    });
  } catch (error) {
    console.error('applyToPublicJob error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
