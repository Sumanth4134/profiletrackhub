const pool = require('../config/db');
const { NOTIFICATION_TYPES, createNotification } = require('../services/notification.service');
const { generatePassword, hashPassword, signToken, verifyPassword } = require('../utils/auth');

function sanitizeAdmin(admin) {
  if (!admin) {
    return null;
  }

  return {
    id: admin.id,
    name: admin.name,
    phone: admin.phone,
    role: admin.role,
    status: admin.status,
    bio: admin.bio || '',
    photo_url: admin.photo_url || '',
    created_at: admin.created_at
  };
}

exports.adminLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' });
    }

    const result = await pool.query(`SELECT * FROM admins WHERE phone = $1`, [phone.trim()]);
    const admin = result.rows[0];

    if (!admin || admin.status !== 'active' || !verifyPassword(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    const token = signToken({
      adminId: admin.id,
      role: admin.role,
      phone: admin.phone
    });

    res.json({
      token,
      admin: sanitizeAdmin(admin)
    });
  } catch (error) {
    console.error('adminLogin error:', error);
    res.status(500).json({ error: 'Unable to login right now' });
  }
};

exports.logout = async (_req, res) => {
  res.json({ success: true });
};

exports.getSession = async (req, res) => {
  res.json({ admin: sanitizeAdmin(req.user) });
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    const result = await pool.query(`SELECT * FROM admins WHERE id = $1`, [req.user.id]);
    const admin = result.rows[0];

    if (!admin || !verifyPassword(oldPassword, admin.password_hash)) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    await pool.query(
      `UPDATE admins
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashPassword(newPassword), req.user.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ error: 'Unable to change password' });
  }
};

exports.requestPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const adminResult = await pool.query(
      `SELECT id, phone, status FROM admins WHERE phone = $1 AND role = 'admin'`,
      [phone.trim()]
    );

    const admin = adminResult.rows[0];

    if (!admin || admin.status !== 'active') {
      return res.status(404).json({ error: 'Active admin account not found for that phone number' });
    }

    const existingRequest = await pool.query(
      `SELECT id FROM password_requests
       WHERE admin_id = $1 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [admin.id]
    );

    if (existingRequest.rows[0]) {
      return res.json({ success: true, message: 'Password request already pending' });
    }

    await pool.query(
      `INSERT INTO password_requests (admin_id, phone, status)
       VALUES ($1, $2, 'pending')`,
      [admin.id, admin.phone]
    );

    await createNotification({
      userId: admin.id,
      roleScope: 'ADMIN',
      title: 'Password request submitted',
      message: `A password reset request was submitted for ${admin.phone}.`,
      type: NOTIFICATION_TYPES.PASSWORD_REQUEST_CREATED,
      entityType: 'password_request'
    });

    res.json({ success: true, message: 'Password request sent to super admin' });
  } catch (error) {
    console.error('requestPassword error:', error);
    res.status(500).json({ error: 'Unable to submit password request' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, photoUrl } = req.body;

    const result = await pool.query(
      `UPDATE admins
       SET name = $1,
           bio = $2,
           photo_url = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, phone, role, status, bio, photo_url, created_at`,
      [
        name?.trim() || req.user.name,
        bio?.trim() || '',
        photoUrl?.trim() || '',
        req.user.id
      ]
    );

    res.json({ admin: sanitizeAdmin(result.rows[0]) });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ error: 'Unable to update profile' });
  }
};

exports.resetAdminPassword = async (adminId) => {
  const nextPassword = generatePassword();
  const result = await pool.query(
    `UPDATE admins
     SET password_hash = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, name, phone, role, status, bio, photo_url, created_at`,
    [hashPassword(nextPassword), adminId]
  );

  return {
    password: nextPassword,
    admin: sanitizeAdmin(result.rows[0])
  };
};

exports.sanitizeAdmin = sanitizeAdmin;
