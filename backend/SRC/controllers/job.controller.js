const fs = require('fs');
const path = require('path');

const pool = require('../config/db');
const { getUploadPathFromUrl } = require('../utils/upload-paths');

const DEFAULT_APPLICATION_NAME = 'ProfileTrackHub';

function normalizeLogoUrl(req) {
  if (req.file?.filename) {
    return `/uploads/logos/${req.file.filename}`;
  }

  if (typeof req.body.logoUrl === 'string' && req.body.logoUrl.trim()) {
    return req.body.logoUrl.trim();
  }

  return null;
}

function normalizeJobPayload(req, { requireAll = true } = {}) {
  const payload = {
    applicationName: req.body.applicationName?.trim() || DEFAULT_APPLICATION_NAME,
    logoUrl: normalizeLogoUrl(req),
    jobTitle: req.body.jobTitle?.trim(),
    location: req.body.location?.trim() || '',
    vacancies: Number.parseInt(req.body.vacancies, 10),
    skills: req.body.skills?.trim() || '',
    experience: req.body.experience?.trim() || '',
    jobDescription: req.body.jobDescription?.trim() || '',
    status: req.body.status === 'Inactive' ? 'Inactive' : 'Active'
  };

  if (!Number.isInteger(payload.vacancies) || payload.vacancies < 0) {
    payload.vacancies = NaN;
  }

  if (requireAll && (!payload.jobTitle || Number.isNaN(payload.vacancies) || !payload.location)) {
    return null;
  }

  return payload;
}

exports.getPublicJobs = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, application_name, logo_url, job_title, location, vacancies, skills, experience,
              job_description, status, created_at, updated_at
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

exports.getJobById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, application_name, logo_url, job_title, location, vacancies, skills, experience,
              job_description, status, created_at, updated_at
       FROM jobs
       WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('getJobById error:', error);
    res.status(500).json({ error: 'Failed to load job' });
  }
};

exports.getAdminJobs = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, application_name, logo_url, job_title, location, vacancies, skills, experience,
              job_description, status, created_at, updated_at
       FROM jobs
       ORDER BY updated_at DESC, id DESC`
    );

    res.json(result.rows);
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

    const result = await pool.query(
      `INSERT INTO jobs (
        application_name, logo_url, job_title, location, vacancies, skills, experience, job_description, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        payload.applicationName,
        payload.logoUrl,
        payload.jobTitle,
        payload.location,
        payload.vacancies,
        payload.skills,
        payload.experience,
        payload.jobDescription,
        payload.status
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('createJob error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const currentJob = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [req.params.id]);

    if (!currentJob.rows[0]) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const payload = normalizeJobPayload(req, { requireAll: false });
    const existing = currentJob.rows[0];
    const nextLogoUrl = payload.logoUrl || existing.logo_url;

    if (req.file?.filename && existing.logo_url?.startsWith('/uploads/logos/')) {
      const oldPath = getUploadPathFromUrl(existing.logo_url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const result = await pool.query(
      `UPDATE jobs
       SET application_name = $1,
           logo_url = $2,
           job_title = $3,
           location = $4,
           vacancies = $5,
           skills = $6,
           experience = $7,
           job_description = $8,
           status = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        payload.applicationName || existing.application_name || DEFAULT_APPLICATION_NAME,
        nextLogoUrl,
        payload.jobTitle || existing.job_title,
        payload.location || existing.location || '',
        Number.isNaN(payload.vacancies) ? existing.vacancies : payload.vacancies,
        payload.skills || existing.skills || '',
        payload.experience || existing.experience || '',
        payload.jobDescription || existing.job_description || '',
        payload.status || existing.status,
        req.params.id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('updateJob error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const existing = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [req.params.id]);

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

    await pool.query(`DELETE FROM jobs WHERE id = $1`, [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('deleteJob error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};
