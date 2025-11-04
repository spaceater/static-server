const fsPromises = require("fs").promises;

async function getFileStats(filePath) {
  const stats = await fsPromises.stat(filePath);
  return {
    size: stats.size,
    mtime: stats.mtime
  };
}

function generateStrongETag(stats) {
  const size = stats.size.toString(16);
  const mtime = stats.mtime.getTime().toString(16);
  const etag = `${size}-${mtime}`;
  return etag;
}

function generateWeakETag(stats) {
  return `W/"${generateStrongETag(stats)}"`;
}

async function checkIfModified(req, filePath) {
  const stats = await getFileStats(filePath);
  const etag = generateWeakETag(stats);
  const lastModified = stats.mtime.toUTCString();
  const ifNoneMatch = req.headers["if-none-match"];
  const ifModifiedSince = req.headers["if-modified-since"];
  let modified = true;
  if (ifNoneMatch) {
    if (etag == ifNoneMatch) {
      if (ifModifiedSince) {
        if (lastModified == ifModifiedSince) {
          modified = false;
        }
      }
    }
  }
  return {
    modified,
    etag,
    lastModified
  };
}

function setCacheHeader(res, etag, lastModified) {
  res.setHeader("ETag", etag);
  res.setHeader("Last-Modified", lastModified);
}

module.exports = {
  getFileStats,
  generateStrongETag,
  generateWeakETag,
  checkIfModified,
  setCacheHeader
};
