const pool = require('../config/db');

const NOTIFICATION_TYPES = {
  APPLICATION_CREATED: 'APPLICATION_CREATED',
  JOB_CREATED: 'JOB_CREATED',
  JOB_UPDATED: 'JOB_UPDATED',
  JOB_DELETED: 'JOB_DELETED',
  CANDIDATE_STATUS_UPDATED: 'CANDIDATE_STATUS_UPDATED',
  RESUME_UPLOADED: 'RESUME_UPLOADED',
  HELP_REQUEST_CREATED: 'HELP_REQUEST_CREATED',
  PASSWORD_REQUEST_CREATED: 'PASSWORD_REQUEST_CREATED',
  ADMIN_CREATED: 'ADMIN_CREATED',
  EXPORT_SUCCESS: 'EXPORT_SUCCESS',
  EXPORT_FAILED: 'EXPORT_FAILED',
  SYSTEM: 'SYSTEM'
};

const CATEGORY_TYPE_MAP = {
  applications: [
    NOTIFICATION_TYPES.APPLICATION_CREATED,
    NOTIFICATION_TYPES.CANDIDATE_STATUS_UPDATED,
    NOTIFICATION_TYPES.RESUME_UPLOADED
  ],
  jobs: [
    NOTIFICATION_TYPES.JOB_CREATED,
    NOTIFICATION_TYPES.JOB_UPDATED,
    NOTIFICATION_TYPES.JOB_DELETED,
    NOTIFICATION_TYPES.EXPORT_SUCCESS,
    NOTIFICATION_TYPES.EXPORT_FAILED
  ],
  help_requests: [
    NOTIFICATION_TYPES.HELP_REQUEST_CREATED,
    NOTIFICATION_TYPES.PASSWORD_REQUEST_CREATED,
    NOTIFICATION_TYPES.ADMIN_CREATED
  ],
  system: [NOTIFICATION_TYPES.SYSTEM]
};

function buildScopeClause(user) {
  if (user?.role === 'super_admin') {
    return { clause: '1=1', values: [] };
  }

  return { clause: 'n.user_id = $1', values: [user.id] };
}

function buildNotificationsQuery(user, filters = {}) {
  const scope = buildScopeClause(user);
  const conditions = [scope.clause];
  const values = [...scope.values];

  if (filters.status === 'unread') {
    values.push(false);
    conditions.push(`n.is_read = $${values.length}`);
  }

  if (filters.status === 'read') {
    values.push(true);
    conditions.push(`n.is_read = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search.trim()}%`);
    conditions.push(`(n.title ILIKE $${values.length} OR n.message ILIKE $${values.length})`);
  }

  if (filters.category && CATEGORY_TYPE_MAP[filters.category]) {
    const categoryTypes = CATEGORY_TYPE_MAP[filters.category];
    const placeholders = categoryTypes.map((type) => {
      values.push(type);
      return `$${values.length}`;
    });
    conditions.push(`n.type IN (${placeholders.join(', ')})`);
  }

  return {
    whereClause: conditions.join(' AND '),
    values
  };
}

async function createNotification({
  userId = null,
  roleScope = 'ADMIN',
  actorId = null,
  title,
  message,
  type = NOTIFICATION_TYPES.SYSTEM,
  entityType = 'system',
  entityId = null
}) {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (
        user_id,
        role_scope,
        actor_id,
        title,
        message,
        type,
        entity_type,
        entity_id,
        is_read,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      RETURNING *`,
      [userId, roleScope, actorId, title, message, type, entityType, entityId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('createNotification error:', error);
    return null;
  }
}

module.exports = {
  CATEGORY_TYPE_MAP,
  NOTIFICATION_TYPES,
  buildNotificationsQuery,
  buildScopeClause,
  createNotification
};
