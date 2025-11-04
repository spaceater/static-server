const path = require("path");
const fs = require("fs");
const { supported_image_extensions, fileExists, setCacheHeader } = require("../utility/tools");
const { generateTmpPath, validateTmpFile, findTmpFile,  deleteTmpFile, convertAndStoreImage } = require("../server/imageConverter");
const { getEtagAndLastModified, checkIfModified } = require("../utility/cache");

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

    const tmpImagePath = await findTmpFile(originalImagePath);
    if (tmpImagePath) {
      const validation = await validateTmpFile(tmpImagePath);
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
        const targetImagePath = await generateTmpPath(originalImagePath, convertibleImagePath);
        if (await convertAndStoreImage(convertibleImagePath, targetImagePath, targetExt)) {
          const cacheResult = await getEtagAndLastModified(targetImagePath);
          setCacheHeader(res, cacheResult.etag, cacheResult.lastModified);
          res.writeHead(200, contentType ? { "Content-Type": contentType } : {});
          fs.createReadStream(targetImagePath).pipe(res);
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
  handleImage
};
