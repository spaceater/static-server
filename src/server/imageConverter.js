const path = require("path");
const fsPromises = require("fs").promises;
const sharp = require("sharp");
const { fileExists } = require("../utility/tools");
const { STATIC_PATH, TMP_PATH } = require("../../config");
const { generateStrongETag, getFileStats } = require("../utility/cache");

async function generateTmpPath(originalImagePath, sourceImagePath) {
  const ext = path.extname(originalImagePath);
  const baseName = path.basename(originalImagePath, ext);
  const stats = await getFileStats(sourceImagePath);
  const tmpFileName = `${baseName}${path.extname(sourceImagePath)}.${generateStrongETag(stats).replace(/"/g, "")}.${stats.mtime.getTime()}${ext}`;
  const tmpPath = path.join(TMP_PATH, path.relative(STATIC_PATH, path.dirname(originalImagePath)), tmpFileName);
  return tmpPath;
}

function parseTmpMetadata(tmpPath) {
  const fileName = path.basename(tmpPath);
  const ext = path.extname(tmpPath);
  const parts = fileName.replace(ext, "").split(".");
  if (parts.length < 4) {
    return null;
  }
  const mtime = parseInt(parts[parts.length - 1], 10);
  const etag = `"${parts[parts.length - 2]}"`;
  const sourceExt = parts[parts.length - 3];
  const baseName = parts.slice(0, parts.length - 3).join(".");
  const sourcePath = path.join(STATIC_PATH, path.relative(TMP_PATH, path.dirname(tmpPath)), `${baseName}.${sourceExt}`);

  return {
    baseName,
    sourcePath,
    etag,
    mtime,
    ext
  };
}

async function validateTmpFile(tmpPath) {
  try {
    const metadata = parseTmpMetadata(tmpPath);
    if (!metadata) {
      return false;
    }
    try {
      const sourceStats = await getFileStats(metadata.sourcePath);
      if (sourceStats.mtime.getTime() !== metadata.mtime) {
        return false;
      }
      if (generateStrongETag(sourceStats) !== metadata.etag) {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  } catch (err) {
    return false;
  }
}

async function findTmpFile(originalImagePath) {
  try {
    const targetExt = path.extname(originalImagePath);
    const baseName = path.basename(originalImagePath, targetExt);
    const tmpDir = path.join(TMP_PATH, path.dirname(path.relative(STATIC_PATH, originalImagePath)));
    try {
      await fsPromises.access(tmpDir);
    } catch {
      return null;
    }
    const files = await fsPromises.readdir(tmpDir);
    for (const file of files) {
      if (file.startsWith(baseName) && file.endsWith(targetExt)) {
        return path.join(tmpDir, file);
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function deleteTmpFile(tmpPath) {
  try {
    await fsPromises.unlink(tmpPath);
    return true;
  } catch (err) {
    return false;
  }
}

async function convertAndStoreImage(sourceImagePath, targetImagePath, targetExt) {
  try {
    const targetDir = path.dirname(targetImagePath);
    if (!await fileExists(targetDir)) {
      await fsPromises.mkdir(targetDir, { recursive: true });
    }
    let image = sharp(sourceImagePath);
    if (targetExt === '.avif') {
      image = image.avif();
    } else if (targetExt === '.webp') {
      image = image.webp();
    } else if ((targetExt === '.jpg') || (targetExt === '.jpeg')) {
      image = image.jpeg({ quality: 85 });
    } else if (targetExt === '.png') {
      image = image.png();
    } else if (targetExt === '.gif') {
      image = image.gif();
    } else {
      throw new Error(`Unsupported target extension: ${targetExt}`);
    }
    await image.toFile(targetImagePath);
    return true;
  } catch (err) {
    console.error(`Error converting image from ${sourceImagePath} to ${targetImagePath}:`, err);
    return false;
  }
}

module.exports = {
  generateTmpPath,
  parseTmpMetadata,
  validateTmpFile,
  findTmpFile,
  deleteTmpFile,
  convertAndStoreImage
};
