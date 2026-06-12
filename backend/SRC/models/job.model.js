const pool = require('../config/db');
const { hashPassword } = require('../utils/auth');

const DEFAULT_SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE || '9999999999';
const DEFAULT_SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'Super Admin';
const DEFAULT_SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD?.trim() || '';
const DEFAULT_JOB_ROLES = [
  'General',
  'QA Analyst',
  'Development',
  'API Testing',
  'DevOps',
  'Data Analyst',
  'Cyber Security',
  'Other'
];

async function ensureCandidatesColumns() {
  await pool.query(`
    ALTER TABLE candidates
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS preferred_role VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS source VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS hybrid TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS relocate VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS resume_url TEXT,
    ADD COLUMN IF NOT EXISTS resume_preview_url TEXT,
    ADD COLUMN IF NOT EXISTS extra_file TEXT,
    ADD COLUMN IF NOT EXISTS job_id INTEGER,
    ADD COLUMN IF NOT EXISTS admin_id INTEGER,
    ADD COLUMN IF NOT EXISTS job_title VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS job_role VARCHAR(255) DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS job_description TEXT,
    ADD COLUMN IF NOT EXISTS job_location VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS work_preference TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS contract_type VARCHAR(100) DEFAULT '',
    ADD COLUMN IF NOT EXISTS visa VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS experience VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'New',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    ALTER TABLE candidates
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);
}

async function ensureDatabaseSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(30) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin')),
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      bio TEXT DEFAULT '',
      photo_url TEXT DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_requests (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
      phone VARCHAR(30) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS help_requests (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
      request_type VARCHAR(40) NOT NULL DEFAULT 'Query',
      requester_name VARCHAR(255) NOT NULL DEFAULT '',
      contact_info VARCHAR(255) NOT NULL DEFAULT '',
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'New'
        CHECK (status IN ('New', 'In Review', 'Resolved')),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE help_requests
    DROP CONSTRAINT IF EXISTS help_requests_status_check
  `);

  await pool.query(`
    ALTER TABLE help_requests
    ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS request_type VARCHAR(40) NOT NULL DEFAULT 'Query',
    ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS contact_info VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NOT NULL DEFAULT 'Support request',
    ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'New',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    UPDATE help_requests
    SET request_type = COALESCE(NULLIF(TRIM(request_type), ''), 'Query'),
        requester_name = COALESCE(NULLIF(TRIM(requester_name), ''), 'Recruiter'),
        contact_info = COALESCE(NULLIF(TRIM(contact_info), ''), ''),
        status = CASE
          WHEN status IN ('New', 'In Review', 'Resolved') THEN status
          WHEN status = 'closed' THEN 'Resolved'
          ELSE 'New'
        END
  `);

  await pool.query(`
    ALTER TABLE help_requests
    ADD CONSTRAINT help_requests_status_check
    CHECK (status IN ('New', 'In Review', 'Resolved'))
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
      application_name VARCHAR(255) NOT NULL DEFAULT 'ProfileTrackHub',
      company_name VARCHAR(255) NOT NULL DEFAULT 'ProfileTrackHub',
      logo_url TEXT,
      job_title VARCHAR(255) NOT NULL,
      job_role VARCHAR(255) NOT NULL DEFAULT 'General',
      location VARCHAR(255) DEFAULT '',
      salary VARCHAR(255) DEFAULT '',
      job_type VARCHAR(100) DEFAULT '',
      vacancies INTEGER NOT NULL DEFAULT 1,
      skills TEXT,
      experience VARCHAR(255),
      job_description TEXT,
      public_slug VARCHAR(255) UNIQUE,
      public_token VARCHAR(255),
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) NOT NULL DEFAULT 'ProfileTrackHub',
    ADD COLUMN IF NOT EXISTS public_slug VARCHAR(255),
    ADD COLUMN IF NOT EXISTS public_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS application_name VARCHAR(255) NOT NULL DEFAULT 'ProfileTrackHub',
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS job_role VARCHAR(255) NOT NULL DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS salary VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS job_type VARCHAR(100) DEFAULT ''
  `);

  await pool.query(`
    UPDATE jobs
    SET job_role = 'General'
    WHERE job_role IS NULL OR TRIM(job_role) = ''
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_roles (
      id SERIAL PRIMARY KEY,
      role_name VARCHAR(255) NOT NULL UNIQUE,
      created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ads (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL,
      link_url TEXT DEFAULT '',
      target_page VARCHAR(40) NOT NULL DEFAULT 'both'
        CHECK (target_page IN ('recruiter_dashboard', 'public_jobs', 'both')),
      status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Inactive')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
      role_scope VARCHAR(20) NOT NULL DEFAULT 'ADMIN'
        CHECK (role_scope IN ('SUPER_ADMIN', 'ADMIN', 'RECRUITER')),
      actor_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(60) NOT NULL DEFAULT 'SYSTEM',
      entity_type VARCHAR(60) NOT NULL DEFAULT 'system',
      entity_id INTEGER,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS role_scope VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    ADD COLUMN IF NOT EXISTS actor_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Notification',
    ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS type VARCHAR(60) NOT NULL DEFAULT 'SYSTEM',
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(60) NOT NULL DEFAULT 'system',
    ADD COLUMN IF NOT EXISTS entity_id INTEGER,
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    UPDATE notifications
    SET role_scope = 'ADMIN'
    WHERE role_scope IS NULL OR role_scope NOT IN ('SUPER_ADMIN', 'ADMIN', 'RECRUITER')
  `);

  await pool.query(`
    ALTER TABLE ads
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS link_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS target_page VARCHAR(40) NOT NULL DEFAULT 'both',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    UPDATE ads
    SET target_page = 'both'
    WHERE target_page IS NULL OR target_page NOT IN ('recruiter_dashboard', 'public_jobs', 'both')
  `);

  await pool.query(`
    UPDATE ads
    SET status = 'Inactive'
    WHERE status IS NULL OR status NOT IN ('Active', 'Inactive')
  `);

  await pool.query(`
    UPDATE ads
    SET start_date = COALESCE(start_date, CURRENT_DATE),
        end_date = COALESCE(end_date, CURRENT_DATE)
    WHERE start_date IS NULL OR end_date IS NULL
  `);

  await ensureCandidatesColumns();

  await pool.query(`
    UPDATE candidates
    SET job_role = 'General'
    WHERE job_role IS NULL OR TRIM(job_role) = ''
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_jobs_admin_id ON jobs(admin_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_jobs_public_slug ON jobs(public_slug)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_jobs_job_role ON jobs(job_role)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_candidates_admin_id ON candidates(admin_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_requests_status ON password_requests(status)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_help_requests_admin_id ON help_requests(admin_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_help_requests_created_at ON help_requests(created_at DESC)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_job_roles_role_name ON job_roles(role_name)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ads_status_target_dates
    ON ads(status, target_page, start_date, end_date)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications(user_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON notifications(created_at DESC)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read
    ON notifications(is_read)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_type
    ON notifications(type)
  `);

  for (const roleName of DEFAULT_JOB_ROLES) {
    await pool.query(
      `INSERT INTO job_roles (role_name)
       VALUES ($1)
       ON CONFLICT (role_name) DO NOTHING`,
      [roleName]
    );
  }

  await pool.query(`
    INSERT INTO job_roles (role_name)
    SELECT DISTINCT COALESCE(NULLIF(TRIM(job_role), ''), 'General')
    FROM jobs
    WHERE COALESCE(NULLIF(TRIM(job_role), ''), 'General') <> ''
    ON CONFLICT (role_name) DO NOTHING
  `);

  const superAdminResult = await pool.query(
    `SELECT id FROM admins WHERE role = 'super_admin' ORDER BY id ASC LIMIT 1`
  );

  if (!superAdminResult.rows[0]) {
    if (!DEFAULT_SUPER_ADMIN_PASSWORD) {
      throw new Error(
        'SUPER_ADMIN_PASSWORD must be set in backend/.env before the initial super admin can be seeded.'
      );
    }

    await pool.query(
      `INSERT INTO admins (name, phone, password_hash, role, status)
       VALUES ($1, $2, $3, 'super_admin', 'active')`,
      [DEFAULT_SUPER_ADMIN_NAME, DEFAULT_SUPER_ADMIN_PHONE, hashPassword(DEFAULT_SUPER_ADMIN_PASSWORD)]
    );

    console.log('Initial super admin seeded from environment configuration.');
  }
}

module.exports = {
  ensureDatabaseSchema
};
