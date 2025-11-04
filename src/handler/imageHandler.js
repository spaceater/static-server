const path = require("path");
const fs = require("fs");
const { STATIC_PATH, TMP_PATH } = require("../../config");
const { fileExists, supported_image_extensions } = require("../utility/tools");
const { convertAndStoreImage } = require("../server/imageConverter");
const { checkIfModified, setCacheHeader } = require("../utility/cache");
const { generateTmpPath, validateTmpFile, findTmpFile, deleteTmpFile } = require("../utility/tmpMetadata");

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
      const cacheResult = await checkIfModified(req, originalImagePath);
      if (!cacheResult.modified) {
        res.writeHead(304);
        res.end();
        return true;
      }
      setCacheHeader(res, cacheResult.etag, cacheResult.lastModified);
      res.writeHead(200, contentType ? { "Content-Type": contentType } : {});
      fs.createReadStream(originalImagePath).pipe(res);
      return true;
    }

    const tmpImagePath = await findTmpFile(originalImagePath, targetExt, STATIC_PATH, TMP_PATH);
    if (tmpImagePath) {
      const validation = await validateTmpFile(tmpImagePath, STATIC_PATH, TMP_PATH);
      if (!validation) {
        await deleteTmpFile(tmpImagePath);
      } else {
        const cacheResult = await checkIfModified(req, tmpImagePath);
        if (!cacheResult.modified) {
          res.writeHead(304);
          res.end();
          return true;
        }
        setCacheHeader(res, cacheResult.etag, cacheResult.lastModified);
        res.writeHead(200, contentType ? { "Content-Type": contentType } : {});
        fs.createReadStream(tmpImagePath).pipe(res);
        return true;
      }
    }

    for (const extension of supported_image_extensions) {
      const convertibleImagePath = path.join(fileDir, fileName + extension);
      if (await fileExists(convertibleImagePath)) {
        const tmpPath = await generateTmpPath(originalImagePath, convertibleImagePath, targetExt, STATIC_PATH, TMP_PATH);
        if (await fileExists(tmpPath)) {
          const validation = await validateTmpFile(tmpPath, STATIC_PATH, TMP_PATH);
          if (!validation) {
            await deleteTmpFile(tmpPath);
          } else {
            const cacheResult = await checkIfModified(req, tmpPath);
            if (!cacheResult.modified) {
              res.writeHead(304);
              res.end();
              return true;
            }
            setCacheHeader(res, cacheResult.etag, cacheResult.lastModified);
            res.writeHead(200, contentType ? { "Content-Type": contentType } : {});
            fs.createReadStream(tmpPath).pipe(res);
            return true;
          }
        }
        if (await convertAndStoreImage(convertibleImagePath, tmpPath, targetExt)) {
          res.writeHead(200, contentType ? { "Content-Type": contentType } : {});
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
