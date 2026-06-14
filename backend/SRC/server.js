const express = require('express');
const path = require('path');

const app = require('./app');
const { ensureDatabaseSchema } = require('./models/job.model');
const { getUploadRoot } = require('./utils/upload-paths');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
let schemaReady;

app.use('/uploads', express.static(getUploadRoot()));
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

function ensureSchemaReady() {
  if (!schemaReady) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl || databaseUrl.includes('<SUPABASE_POSTGRES_CONNECTION_STRING>')) {
      throw new Error('DATABASE_URL must be set to the Supabase PostgreSQL connection string.');
    }

    schemaReady = ensureDatabaseSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}

function shouldInitializeSchemaForRequest() {
  return !process.env.VERCEL || process.env.RUN_SCHEMA_ON_STARTUP === 'true';
}

async function startServer() {
  try {
    await ensureSchemaReady();
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log(`Local access: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

async function vercelHandler(req, res) {
  try {
    if (shouldInitializeSchemaForRequest()) {
      await ensureSchemaReady();
    }

    return app(req, res);
  } catch (error) {
    console.error('Server startup failed:', error);
    res.statusCode = 500;
    res.end('Server startup failed');
  }
}

if (require.main === module) {
  startServer();
} else {
  module.exports = vercelHandler;
}
