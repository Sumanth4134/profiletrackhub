const pool = require('../config/db');

function normalizeRoleName(rawRoleName = '') {
  return rawRoleName.trim().replace(/\s+/g, ' ');
}

async function fetchRoleList() {
  const result = await pool.query(
    `SELECT id, role_name, created_by, created_at
     FROM job_roles
     ORDER BY CASE WHEN role_name = 'General' THEN 0 ELSE 1 END, role_name ASC`
  );

  return result.rows;
}

exports.getJobRoles = async (_req, res) => {
  try {
    const roles = await fetchRoleList();
    res.json(roles);
  } catch (error) {
    console.error('getJobRoles error:', error);
    res.status(500).json({ error: 'Failed to load job roles' });
  }
};

exports.createJobRole = async (req, res) => {
  try {
    const roleName = normalizeRoleName(req.body.roleName);

    if (!roleName) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const existing = await pool.query(
      `SELECT id, role_name, created_by, created_at
       FROM job_roles
       WHERE LOWER(role_name) = LOWER($1)
       LIMIT 1`,
      [roleName]
    );

    if (existing.rows[0]) {
      return res.json(existing.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO job_roles (role_name, created_by)
       VALUES ($1, $2)
       RETURNING id, role_name, created_by, created_at`,
      [roleName, req.user?.id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('createJobRole error:', error);
    res.status(500).json({ error: 'Failed to create job role' });
  }
};

exports.getPublicJobRoles = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         jr.role_name,
         COUNT(j.id)::int AS active_jobs
       FROM job_roles jr
       LEFT JOIN jobs j
         ON LOWER(COALESCE(NULLIF(TRIM(j.job_role), ''), 'General')) = LOWER(jr.role_name)
        AND j.status = 'Active'
       GROUP BY jr.role_name
       HAVING COUNT(j.id) > 0
       ORDER BY active_jobs DESC, jr.role_name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('getPublicJobRoles error:', error);
    res.status(500).json({ error: 'Failed to load public job roles' });
  }
};
