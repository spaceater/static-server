const path = require("path");
const fsPromises = require("fs").promises;

function isImageFile(filePath, supportedExtensions) {
  const ext = path.extname(filePath).toLowerCase();
  return supportedExtensions.includes(ext);
}

async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  isImageFile,
  fileExists
};
