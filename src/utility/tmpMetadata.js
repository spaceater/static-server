const path = require("path");
const fsPromises = require("fs").promises;
const { generateStrongETag, getFileStats } = require("./cache");

async function generateTmpPath(originalImagePath, sourceImagePath, targetExt, STATIC_PATH, TMP_PATH) {
  const stats = await getFileStats(sourceImagePath);
  const relativePath = path.relative(STATIC_PATH, originalImagePath);
  const dir = path.dirname(relativePath);
  const baseName = path.basename(originalImagePath, path.extname(originalImagePath));
  const tmpFileName = `${baseName}${path.extname(originalImagePath)}.${generateStrongETag(stats)}.${stats.mtime.getTime()}${targetExt}`;
  const tmpPath = path.join(TMP_PATH, dir, tmpFileName);
  return tmpPath;
}

function parseTmpMetadata(tmpPath, STATIC_PATH, TMP_PATH) {
  const fileName = path.basename(tmpPath);
  const ext = path.extname(tmpPath);
  const parts = fileName.replace(ext, "").split(".");
  if (parts.length < 4) {
    return null;
  }
  const mtime = parts[parts.length - 1];
  const etag = parts[parts.length - 2];
  const sourceExt = parts[parts.length - 3];
  const baseName = parts.slice(0, parts.length - 3).join(".");
  const targetExt = ext;

  const tmpRelativeToTmp = path.relative(TMP_PATH, tmpPath);
  const tmpDirRelative = path.dirname(tmpRelativeToTmp);
  const sourceRelativePath = path.join(tmpDirRelative, `${baseName}.${sourceExt}`);
  const sourcePath = path.join(STATIC_PATH, sourceRelativePath);

  return {
    baseName,
    sourcePath,
    etag,
    mtime,
    targetExt
  };
}

async function validateTmpFile(tmpPath, STATIC_PATH, TMP_PATH) {
  try {
    const metadata = parseTmpMetadata(tmpPath, STATIC_PATH, TMP_PATH);
    if (!metadata) {
      return false;
    }
    const sourcePath = metadata.sourcePath;
    try {
      const sourceStats = await getFileStats(sourcePath);
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

async function findTmpFile(originalImagePath, targetExt, STATIC_PATH, TMP_PATH) {
  try {
    const relativePath = path.relative(STATIC_PATH, originalImagePath);
    const baseName = path.basename(originalImagePath, path.extname(originalImagePath));
    const tmpDir = path.join(TMP_PATH, path.dirname(relativePath));
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

/**
 * 删除失效的 tmp 文件
 * @param {string} tmpPath - tmp 文件路径
 * @returns {Promise<boolean>}
 */
async function deleteTmpFile(tmpPath) {
  try {
    await fsPromises.unlink(tmpPath);
    return true;
  } catch (err) {
    // 文件可能不存在或已被删除
    return false;
  }
}

module.exports = {
  generateTmpPath,
  parseTmpMetadata,
  validateTmpFile,
  findTmpFile,
  deleteTmpFile
};
