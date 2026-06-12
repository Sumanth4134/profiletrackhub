const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const pool = require('../config/db');

const execFileAsync = promisify(execFile);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const CONVERTER_SCRIPT = path.join(__dirname, '..', 'utils', 'convert-doc-to-pdf.ps1');

function getAbsoluteUploadPath(relativeUrl = '') {
  if (!relativeUrl) {
    return '';
  }

  return path.join(__dirname, '..', relativeUrl.replace(/^\//, ''));
}

function isDocResume(filePath = '') {
  return /\.(doc|docx)$/i.test(filePath);
}

function isPdfResume(filePath = '') {
  return /\.pdf$/i.test(filePath);
}

function buildPreviewFilePath(sourceAbsolutePath) {
  const parsed = path.parse(sourceAbsolutePath);
  return path.join(parsed.dir, `${parsed.name}.preview.pdf`);
}

function buildPreviewUrl(previewAbsolutePath) {
  return `/uploads/${path.basename(previewAbsolutePath)}`;
}

function previewFileExists(previewUrl = '') {
  if (!previewUrl) {
    return false;
  }

  return fs.existsSync(getAbsoluteUploadPath(previewUrl));
}

async function convertDocumentToPreviewPdf(sourceAbsolutePath) {
  const previewAbsolutePath = buildPreviewFilePath(sourceAbsolutePath);

  await execFileAsync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      CONVERTER_SCRIPT,
      '-SourcePath',
      sourceAbsolutePath,
      '-TargetPath',
      previewAbsolutePath
    ],
    {
      windowsHide: true
    }
  );

  if (!fs.existsSync(previewAbsolutePath)) {
    throw new Error('Preview PDF was not generated');
  }

  return {
    previewAbsolutePath,
    previewUrl: buildPreviewUrl(previewAbsolutePath)
  };
}

async function generateResumePreview(resumeUrl) {
  if (!resumeUrl) {
    return '';
  }

  if (isPdfResume(resumeUrl)) {
    return resumeUrl;
  }

  if (!isDocResume(resumeUrl)) {
    return '';
  }

  const sourceAbsolutePath = getAbsoluteUploadPath(resumeUrl);

  if (!fs.existsSync(sourceAbsolutePath)) {
    return '';
  }

  try {
    const { previewUrl } = await convertDocumentToPreviewPdf(sourceAbsolutePath);
    return previewUrl;
  } catch (error) {
    console.error('generateResumePreview error:', error.message);
    return '';
  }
}

async function ensureCandidateResumePreview(candidate) {
  if (!candidate?.id || !candidate.resume_url) {
    return candidate;
  }

  if (candidate.resume_preview_url && previewFileExists(candidate.resume_preview_url)) {
    return candidate;
  }

  const previewUrl = await generateResumePreview(candidate.resume_url);

  if (!previewUrl) {
    return candidate;
  }

  await pool.query(
    `UPDATE candidates
     SET resume_preview_url = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [previewUrl, candidate.id]
  );

  return {
    ...candidate,
    resume_preview_url: previewUrl
  };
}

function removeResumePreviewFile(previewUrl = '') {
  if (!previewUrl) {
    return;
  }

  const previewAbsolutePath = getAbsoluteUploadPath(previewUrl);

  if (fs.existsSync(previewAbsolutePath)) {
    fs.unlinkSync(previewAbsolutePath);
  }
}

module.exports = {
  ensureCandidateResumePreview,
  generateResumePreview,
  isDocResume,
  isPdfResume,
  removeResumePreviewFile
};
