const fs = require('fs');
const path = require('path');

const pool = require('../config/db');
const { NOTIFICATION_TYPES, createNotification } = require('../services/notification.service');
const { removeResumePreviewFile } = require('../services/resumePreview.service');
const { generatePassword, hashPassword } = require('../utils/auth');
const { getUploadPathFromUrl } = require('../utils/upload-paths');
const { resetAdminPassword, sanitizeAdmin } = require('./auth.controller');

function normalizeAdRow(ad) {
  return {
    ...ad,
    link_url: ad.link_url || '',
    image_url: ad.image_url || ''
  };
}

function normalizeRoleForStorage(role = '') {
  const normalized = String(role || '').trim().toLowerCase();

  if (normalized === 'recruiter' || normalized === 'admin') {
    return 'admin';
  }

  if (normalized === 'super_admin') {
    return 'super_admin';
  }

  return '';
}

exports.getDashboard = async (_req, res) => {
  try {
    const [totals, recentJobs, recentProfiles, adminJobCounts, adminProfileCounts, latestHelpRequests] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE role = 'admin')::int AS total_admins,
           (SELECT COUNT(*)::int FROM jobs) AS total_jobs,
           (SELECT COUNT(*)::int FROM candidates) AS total_profiles,
           (SELECT COUNT(*)::int FROM help_requests) AS total_help_requests
         FROM admins`
      ),
      pool.query(
        `SELECT j.id, j.job_title, j.location, j.status, j.created_at, a.name AS admin_name
         FROM jobs j
         LEFT JOIN admins a ON a.id = j.admin_id
         ORDER BY j.created_at DESC
         LIMIT 5`
      ),
      pool.query(
        `SELECT c.id, c.full_name, c.job_title, c.status, c.created_at, a.name AS admin_name
         FROM candidates c
         LEFT JOIN admins a ON a.id = c.admin_id
         ORDER BY c.created_at DESC
         LIMIT 5`
      ),
      pool.query(
        `SELECT a.id, a.name, COUNT(j.id)::int AS total_jobs
         FROM admins a
         LEFT JOIN jobs j ON j.admin_id = a.id
         WHERE a.role = 'admin'
         GROUP BY a.id
         ORDER BY total_jobs DESC, a.name ASC`
      ),
      pool.query(
        `SELECT a.id, a.name, COUNT(c.id)::int AS total_profiles
         FROM admins a
         LEFT JOIN candidates c ON c.admin_id = a.id
         WHERE a.role = 'admin'
         GROUP BY a.id
         ORDER BY total_profiles DESC, a.name ASC`
      ),
      pool.query(
        `SELECT
           hr.id,
           hr.request_type,
           hr.requester_name,
           hr.contact_info,
           hr.subject,
           hr.status,
           hr.created_at,
           a.name AS admin_name
         FROM help_requests hr
         LEFT JOIN admins a ON a.id = hr.admin_id
         ORDER BY hr.created_at DESC, hr.id DESC
         LIMIT 5`
      )
    ]);

    res.json({
      counts: totals.rows[0],
      recentJobs: recentJobs.rows,
      recentProfiles: recentProfiles.rows,
      adminJobCounts: adminJobCounts.rows,
      adminProfileCounts: adminProfileCounts.rows,
      latestHelpRequests: latestHelpRequests.rows
    });
  } catch (error) {
    console.error('superAdmin.getDashboard error:', error);
    res.status(500).json({ error: 'Failed to load super admin dashboard' });
  }
};

exports.getAdmins = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         a.id,
         a.name,
         NULL::text AS email,
         a.phone,
         a.role,
         a.status,
         a.bio,
         a.photo_url,
         a.created_at,
         COUNT(DISTINCT j.id)::int AS jobs_count,
         COUNT(DISTINCT c.id)::int AS profiles_count
       FROM admins a
       LEFT JOIN jobs j ON j.admin_id = a.id
       LEFT JOIN candidates c ON c.admin_id = a.id
       GROUP BY a.id
       ORDER BY
         CASE WHEN a.role = 'super_admin' THEN 0 ELSE 1 END,
         a.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('superAdmin.getAdmins error:', error);
    res.status(500).json({ error: 'Failed to load admins' });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: 'Admin name and phone number are required' });
    }

    const password = generatePassword();
    const result = await pool.query(
      `INSERT INTO admins (name, phone, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'active')
       RETURNING id, name, phone, role, status, bio, photo_url, created_at`,
      [name.trim(), phone.trim(), hashPassword(password)]
    );

    await createNotification({
      userId: result.rows[0].id,
      roleScope: 'ADMIN',
      actorId: req.user.id,
      title: 'Recruiter account created',
      message: `Your recruiter account was created by ${req.user.name || 'Super Admin'}.`,
      type: NOTIFICATION_TYPES.ADMIN_CREATED,
      entityType: 'admin',
      entityId: result.rows[0].id
    });

    res.status(201).json({
      admin: sanitizeAdmin(result.rows[0]),
      generatedPassword: password
    });
  } catch (error) {
    console.error('superAdmin.createAdmin error:', error);
    const duplicate = error?.code === '23505';
    res.status(duplicate ? 409 : 500).json({
      error: duplicate ? 'An admin with that phone number already exists' : 'Failed to create admin'
    });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const current = await pool.query(`SELECT * FROM admins WHERE id = $1 AND role = 'admin'`, [req.params.id]);
    const admin = current.rows[0];

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const result = await pool.query(
      `UPDATE admins
       SET name = $1,
           phone = $2,
           status = $3,
           bio = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, phone, role, status, bio, photo_url, created_at`,
      [
        req.body.name?.trim() || admin.name,
        req.body.phone?.trim() || admin.phone,
        req.body.status === 'inactive' ? 'inactive' : 'active',
        req.body.bio?.trim() ?? admin.bio,
        req.params.id
      ]
    );

    res.json({ admin: sanitizeAdmin(result.rows[0]) });
  } catch (error) {
    console.error('superAdmin.updateAdmin error:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
};

exports.updateAdminRole = async (req, res) => {
  try {
    const targetId = Number.parseInt(req.params.id, 10);
    const nextRole = normalizeRoleForStorage(req.body.role);

    if (!Number.isInteger(targetId)) {
      return res.status(400).json({ error: 'Invalid admin id' });
    }

    if (!nextRole) {
      return res.status(400).json({ error: 'Allowed roles are recruiter and super_admin' });
    }

    if (req.user.id === targetId) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const current = await pool.query(
      `SELECT id, name, phone, role, status, bio, photo_url, created_at
       FROM admins
       WHERE id = $1`,
      [targetId]
    );
    const admin = current.rows[0];

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (admin.role === nextRole) {
      return res.json({ admin: sanitizeAdmin(admin) });
    }

    if (admin.role === 'super_admin' && nextRole === 'admin') {
      const superAdminCount = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM admins
         WHERE role = 'super_admin'`
      );

      if ((superAdminCount.rows[0]?.total || 0) <= 1) {
        return res.status(400).json({ error: 'You cannot demote the last remaining super admin' });
      }
    }

    const result = await pool.query(
      `UPDATE admins
       SET role = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, phone, role, status, bio, photo_url, created_at`,
      [nextRole, targetId]
    );

    res.json({ admin: sanitizeAdmin(result.rows[0]) });
  } catch (error) {
    console.error('superAdmin.updateAdminRole error:', error);
    res.status(500).json({ error: 'Failed to update admin role' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const current = await pool.query(`SELECT id FROM admins WHERE id = $1 AND role = 'admin'`, [req.params.id]);

    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const payload = await resetAdminPassword(req.params.id);
    await pool.query(
      `UPDATE password_requests
       SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
       WHERE admin_id = $1 AND status = 'pending'`,
      [req.params.id]
    );

    res.json({
      admin: payload.admin,
      generatedPassword: payload.password
    });
  } catch (error) {
    console.error('superAdmin.resetPassword error:', error);
    res.status(500).json({ error: 'Failed to reset admin password' });
  }
};

exports.getJobs = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*, a.name AS admin_name, a.phone AS admin_phone
       FROM jobs j
       LEFT JOIN admins a ON a.id = j.admin_id
       ORDER BY j.updated_at DESC, j.id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('superAdmin.getJobs error:', error);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
};

exports.getProfiles = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, a.name AS admin_name, a.phone AS admin_phone
       FROM candidates c
       LEFT JOIN admins a ON a.id = c.admin_id
       ORDER BY c.created_at DESC, c.id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('superAdmin.getProfiles error:', error);
    res.status(500).json({ error: 'Failed to load profiles' });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM candidates WHERE id = $1`, [req.params.id]);
    const candidate = result.rows[0];

    if (!candidate) {
      return res.status(404).json({ error: 'Profile not found' });
    }

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

    await pool.query(`DELETE FROM candidates WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('superAdmin.deleteProfile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
};

exports.getAds = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, creator.name AS created_by_name
       FROM ads a
       LEFT JOIN admins creator ON creator.id = a.created_by
       ORDER BY a.updated_at DESC, a.id DESC`
    );

    res.json(result.rows.map(normalizeAdRow));
  } catch (error) {
    console.error('superAdmin.getAds error:', error);
    res.status(500).json({ error: 'Failed to load ads' });
  }
};

exports.createAd = async (req, res) => {
  try {
    const {
      title,
      description,
      imageUrl,
      targetPage,
      status,
      startDate,
      endDate,
      linkUrl
    } = req.body;

    const trimmedTitle = title?.trim() || '';
    const trimmedDescription = description?.trim() || '';
    const normalizedTargetPage = ['recruiter_dashboard', 'public_jobs', 'both'].includes(targetPage)
      ? targetPage
      : 'both';
    const normalizedStatus = status === 'Inactive' ? 'Inactive' : 'Active';
    const normalizedLinkUrl = linkUrl?.trim() || '';
    const uploadedImageUrl = req.file ? `/uploads/ads/${req.file.filename}` : '';
    const normalizedImageUrl = uploadedImageUrl || imageUrl?.trim() || '';

    if (!trimmedTitle || !trimmedDescription || !normalizedImageUrl || !startDate || !endDate) {
      return res.status(400).json({ error: 'Title, description, image, start date, and end date are required' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }

    const result = await pool.query(
      `INSERT INTO ads (
        title,
        description,
        image_url,
        link_url,
        target_page,
        status,
        start_date,
        end_date,
        created_by,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        trimmedTitle,
        trimmedDescription,
        normalizedImageUrl,
        normalizedLinkUrl,
        normalizedTargetPage,
        normalizedStatus,
        startDate,
        endDate,
        req.user.id
      ]
    );

    res.status(201).json(normalizeAdRow(result.rows[0]));
  } catch (error) {
    console.error('superAdmin.createAd error:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
};

exports.deleteAd = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ads WHERE id = $1`, [req.params.id]);
    const ad = result.rows[0];

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    if (ad.image_url?.startsWith('/uploads/ads/')) {
      const imagePath = getUploadPathFromUrl(ad.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await pool.query(`DELETE FROM ads WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('superAdmin.deleteAd error:', error);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
};

exports.getPasswordRequests = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.*, a.name AS admin_name
       FROM password_requests pr
       LEFT JOIN admins a ON a.id = pr.admin_id
       ORDER BY pr.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('superAdmin.getPasswordRequests error:', error);
    res.status(500).json({ error: 'Failed to load password requests' });
  }
};

exports.resolvePasswordRequest = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE password_requests
       SET status = 'resolved',
           resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Password request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('superAdmin.resolvePasswordRequest error:', error);
    res.status(500).json({ error: 'Failed to resolve password request' });
  }
};
