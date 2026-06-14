const cors = require('cors');
const express = require('express');

const adminRoutes = require('./routes/admin.routes');
const adminRoleRoutes = require('./routes/admin-role.routes');
const authRoutes = require('./routes/auth.routes');
const candidateRoutes = require('./routes/candidate.routes');
const helpRoutes = require('./routes/help.routes');
const jobRoutes = require('./routes/job.routes');
const jobRoleRoutes = require('./routes/jobRole.routes');
const notificationRoutes = require('./routes/notification.routes');
const publicRoutes = require('./routes/public.routes');
const superAdminRoutes = require('./routes/super-admin.routes');

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/help-requests', helpRoutes);
app.use('/api/help-center', helpRoutes);
app.use('/api/job-roles', jobRoleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admins', adminRoleRoutes);
app.use('/api/super-admin', superAdminRoutes);

module.exports = app;
