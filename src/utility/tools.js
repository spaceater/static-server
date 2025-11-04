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

module.exports = {
  isImageFile,
  fileExists,
  supported_image_extensions
};
