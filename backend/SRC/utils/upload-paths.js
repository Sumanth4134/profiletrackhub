const path = require('path');

const localUploadRoot = path.join(__dirname, '..', 'uploads');
const serverlessUploadRoot = path.join('/tmp', 'profiletrackhub', 'uploads');

function getUploadRoot() {
  return process.env.VERCEL ? serverlessUploadRoot : localUploadRoot;
}

function getUploadPath(...segments) {
  return path.join(getUploadRoot(), ...segments);
}

function getUploadPathFromUrl(uploadUrl = '') {
  return getUploadPath(uploadUrl.replace(/^\/?uploads\/?/, ''));
}

module.exports = {
  getUploadPath,
  getUploadPathFromUrl,
  getUploadRoot
};
