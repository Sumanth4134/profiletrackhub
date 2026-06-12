const express = require('express');
const path = require('path');

const app = require('./app');
const { ensureDatabaseSchema } = require('./models/job.model');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    !path.extname(req.path)
  ) {
    return res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  }

  next();
});

async function startServer() {
  try {
    await ensureDatabaseSchema();

    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log(`Local access: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
