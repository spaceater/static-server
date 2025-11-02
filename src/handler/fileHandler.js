const fsPromises = require("fs").promises;

const mime = {
  ".css": "text/css",
  ".js": "text/javascript",
  ".html": "text/html",
  ".json": "application/json"
};

async function handleFile(filePath, res) {
  try {
    await fsPromises.access(filePath);
    res.writeHead(200);
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch (err) {
    console.error("Error handling file:", err);
    return false;
  }
}

module.exports = {
  handleFile,
  mime
};
