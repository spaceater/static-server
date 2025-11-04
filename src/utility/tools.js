const path = require("path");
const fsPromises = require("fs").promises;

const supported_image_extensions = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'
];

function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return supported_image_extensions.includes(ext);
}

async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function setCacheHeader(res, etag, lastModified) {
  res.setHeader("ETag", etag);
  res.setHeader("Last-Modified", lastModified);
}

module.exports = {
  supported_image_extensions,
  isImageFile,
  fileExists,
  setCacheHeader
};
