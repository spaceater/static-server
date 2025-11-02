const path = require("path");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = parseInt(process.env.PORT) || 2999;
const STATIC_PATH = path.resolve(process.env.STATIC_PATH || "./static");
const TMP_PATH = path.resolve(process.env.TMP_PATH || path.join(STATIC_PATH, "tmp"));

module.exports = {
  STATIC_PATH,
  TMP_PATH,
  HOST,
  PORT
};
