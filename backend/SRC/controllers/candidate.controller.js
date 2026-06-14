const fs = require('fs');
const path = require('path');

const pool = require('../config/db');
const { ensureCandidateResumePreview, generateResumePreview, removeResumePreviewFile } = require('../services/resumePreview.service');
const { getUploadPathFromUrl } = require('../utils/upload-paths');

exports.createCandidate = async (req, res) => {
  try {
    const {
      jobId,
      job_description,
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
      job_title,
      linkedin_url,
      visa
    } = req.body;

    if (!full_name || !email || !phone || !linkedin_url) {
      return res.status(400).json({ error: 'Required fields missing' });
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

    let selectedJobId = jobId ? Number.parseInt(jobId, 10) : null;
    let selectedJobTitle = job_title || 'Not Provided';
    let selectedJobDescription = job_description || '';

    if (selectedJobId && Number.isInteger(selectedJobId)) {
      const jobLookup = await pool.query(
        `SELECT id, job_title, job_description FROM jobs WHERE id = $1`,
        [selectedJobId]
      );

      if (jobLookup.rows[0]) {
        selectedJobId = jobLookup.rows[0].id;
        selectedJobTitle = jobLookup.rows[0].job_title;
        selectedJobDescription = jobLookup.rows[0].job_description || selectedJobDescription;
      }
    } else {
      selectedJobId = null;
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
        job_title,
        linkedin_url,
        job_description,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING *`,
      [
        full_name,
        email,
        phone,
        skills || '',
        experience || null,
        location || '',
        preferred_role || '',
        source || '',
        hybrid || 'Not specified',
        relocate || '',
        resume,
        resumePreviewUrl,
        extraFile,
        selectedJobId,
        selectedJobTitle,
        linkedin_url || '',
        selectedJobDescription,
        'New'
      ]
    );

    const candidateWithPreview = await ensureCandidateResumePreview(result.rows[0]);

    res.json({
      success: true,
      message: 'Candidate submitted successfully',
      data: candidateWithPreview
    });
  } catch (err) {
    console.error('createCandidate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const { name, job_title, experience, status } = req.query;

    let query = `SELECT * FROM candidates WHERE 1=1`;
    const values = [];

    if (name) {
      values.push(`%${name}%`);
      query += ` AND full_name ILIKE $${values.length}`;
    }

    if (job_title) {
      values.push(`%${job_title}%`);
      query += ` AND job_title ILIKE $${values.length}`;
    }

    if (experience) {
      values.push(`%${experience}%`);
      query += ` AND experience::text ILIKE $${values.length}`;
    }

    if (status) {
      values.push(status);
      query += ` AND status = $${values.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('getCandidates error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCandidateById = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM candidates WHERE id = $1`, [req.params.id]);
    const candidate = await ensureCandidateResumePreview(result.rows[0]);
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE candidates SET status = $1 WHERE id = $2 RETURNING *`,
      [req.body.status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM candidates`);
    const json2csv = await import('json2csv');
    const Parser = json2csv.Parser || json2csv.default?.Parser || json2csv.default;
    const parser = new Parser();
    const csv = parser.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('candidates.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportExcel = async (req, res) => {
  const ExcelJS = (await import('exceljs')).default;
  const { name, job_title, experience, status } = req.query;

  let query = `SELECT * FROM candidates WHERE 1=1`;
  const values = [];

  if (name) {
    values.push(`%${name}%`);
    query += ` AND full_name ILIKE $${values.length}`;
  }

  if (job_title) {
    values.push(`%${job_title}%`);
    query += ` AND job_title ILIKE $${values.length}`;
  }

  if (experience) {
    values.push(`%${experience}%`);
    query += ` AND experience::text ILIKE $${values.length}`;
  }

  if (status) {
    values.push(status);
    query += ` AND status = $${values.length}`;
  }

  const result = await pool.query(query, values);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Candidates');

  sheet.columns = [
    { header: 'Name', key: 'full_name' },
    { header: 'Job Title', key: 'job_title' },
    { header: 'Phone', key: 'phone' },
    { header: 'Experience', key: 'experience' },
    { header: 'Status', key: 'status' },
    { header: 'LinkedIn', key: 'linkedin_url' },
    { header: 'Skills', key: 'skills' },
    { header: 'Location', key: 'location' },
    { header: 'Preferred Role', key: 'preferred_role' },
    { header: 'Relocate', key: 'relocate' },
    { header: 'Visa', key: 'visa' },
    { header: 'Hybrid', key: 'hybrid' }
  ];

  result.rows.forEach((row) => sheet.addRow(row));

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename=candidates.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
};

exports.deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM candidates WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
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

    await pool.query(`DELETE FROM candidates WHERE id = $1`, [id]);

    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    console.error('deleteCandidate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
