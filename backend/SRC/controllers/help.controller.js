const pool = require('../config/db');
const { NOTIFICATION_TYPES, createNotification } = require('../services/notification.service');

const REQUEST_TYPES = new Set([
  'Password Request',
  'Suggestion',
  'Query',
  'New User Request'
]);

const STATUS_OPTIONS = new Set(['New', 'In Review', 'Resolved']);

function normalizeHelpRow(row) {
  return {
    ...row,
    request_type: row.request_type || 'Query',
    requester_name: row.requester_name || row.admin_name || 'Recruiter',
    contact_info: row.contact_info || '',
    status: row.status || 'New'
  };
}

exports.getHelpRequests = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const values = [];
    const conditions = [];

    if (!isSuperAdmin) {
      values.push(req.user.id);
      conditions.push(`hr.admin_id = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT
         hr.*,
         a.name AS admin_name,
         a.phone AS admin_phone
       FROM help_requests hr
       LEFT JOIN admins a ON a.id = hr.admin_id
       ${whereClause}
       ORDER BY hr.created_at DESC, hr.id DESC`,
      values
    );

    res.json(result.rows.map(normalizeHelpRow));
  } catch (error) {
    console.error('help.getHelpRequests error:', error);
    res.status(500).json({ error: 'Failed to load help requests' });
  }
};

exports.createHelpRequest = async (req, res) => {
  try {
    const requestType = REQUEST_TYPES.has(req.body.requestType) ? req.body.requestType : 'Query';
    const requesterName = req.body.name?.trim() || req.user.name || 'Recruiter';
    const contactInfo = req.body.contactInfo?.trim() || req.user.phone || '';
    const subject = req.body.subject?.trim() || '';
    const message = req.body.message?.trim() || '';

    if (!subject || !message || !contactInfo) {
      return res.status(400).json({ error: 'Contact info, subject, and message are required' });
    }

    const result = await pool.query(
      `INSERT INTO help_requests (
        admin_id,
        request_type,
        requester_name,
        contact_info,
        subject,
        message,
        status,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,'New',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      RETURNING *`,
      [req.user.id, requestType, requesterName, contactInfo, subject, message]
    );

    await createNotification({
      userId: req.user.id,
      roleScope: 'ADMIN',
      actorId: req.user.id,
      title: 'Help request created',
      message: `${requestType}: ${subject} was submitted successfully.`,
      type: NOTIFICATION_TYPES.HELP_REQUEST_CREATED,
      entityType: 'help_request',
      entityId: result.rows[0].id
    });

    res.status(201).json(normalizeHelpRow(result.rows[0]));
  } catch (error) {
    console.error('help.createHelpRequest error:', error);
    res.status(500).json({ error: 'Failed to create help request' });
  }
};

exports.updateHelpRequestStatus = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can update help request status' });
    }

    const nextStatus = STATUS_OPTIONS.has(req.body.status) ? req.body.status : '';

    if (!nextStatus) {
      return res.status(400).json({ error: 'Invalid help request status' });
    }

    const result = await pool.query(
      `UPDATE help_requests
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [nextStatus, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Help request not found' });
    }

    res.json(normalizeHelpRow(result.rows[0]));
  } catch (error) {
    console.error('help.updateHelpRequestStatus error:', error);
    res.status(500).json({ error: 'Failed to update help request status' });
  }
};
