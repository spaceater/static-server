const path = require("path");
const fs = require("fs");
const { STATIC_PATH, TMP_PATH } = require("../../config");
const { fileExists } = require("../utility/tools");
const { convertAndStoreImage } = require("../server/imageConverter");

const supported_image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

async function handleImage(filePath, req, res) {
  try {
    const acceptHeader = req.headers["accept"] || '';
    const fileDir = path.dirname(filePath);
    let originalExt = path.extname(filePath);
    const fileName = path.basename(filePath, originalExt);
    originalExt = originalExt.toLowerCase();

    let targetExt = originalExt;
    let contentType = null;
    if (acceptHeader.includes("image/avif")) {
      targetExt = '.avif';
      contentType = 'image/avif';
    } else if (acceptHeader.includes("image/webp")) {
      targetExt = '.webp';
      contentType = 'image/webp';
    }

    const originalImagePath = path.join(fileDir, fileName + targetExt);
    if (await fileExists(originalImagePath)) {
      if (contentType) {
        res.writeHead(200, { "Content-Type": contentType });
      }
      fs.createReadStream(originalImagePath).pipe(res);
      return true;
    }

    const tmpPath = path.join(TMP_PATH, path.relative(STATIC_PATH, originalImagePath));
    if (await fileExists(tmpPath)) {
      if (contentType) {
        res.writeHead(200, { "Content-Type": contentType });
      }
      fs.createReadStream(tmpPath).pipe(res);
      return true;
    }

    for (const extension of supported_image_extensions) {
      const convertibleImagePath = path.join(fileDir, fileName + extension);
      if (await fileExists(convertibleImagePath)) {
        if (await convertAndStoreImage(convertibleImagePath, tmpPath, targetExt)) {
          if (contentType) {
            res.writeHead(200, { "Content-Type": contentType });
          }
          fs.createReadStream(tmpPath).pipe(res);
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.error("Error processing image:", err);
    return false;
  }
}

module.exports = {
  handleImage,
  supported_image_extensions
};
