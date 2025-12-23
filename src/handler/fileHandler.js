const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { checkIfModified } = require("../utility/cache");
const { setCacheHeader } = require("../utility/tools");

const mime = {
  ".css": "text/css",
  ".js": "text/javascript",
  ".html": "text/html",
  ".json": "application/json",
  ".svg": "image/svg+xml"
};

async function handleFile(filePath, req, res) {
  try {
    await fsPromises.access(filePath);
    const cacheResult = await checkIfModified(req, filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mime[ext] || "application/octet-stream";
    if (!cacheResult.modified) {
      res.writeHead(304);
      res.end();
      return true;
    }
    setCacheHeader(res, cacheResult.etag, cacheResult.lastModified);
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch (err) {
    console.error("Error handling file:", err);
    return false;
  }
}

module.exports = {
  handleFile
};
