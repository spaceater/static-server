const express = require("express");
const { registerRoutes } = require("./src/router");
const corsMiddleware = require("./src/middleware/cors");
const { TMP_PATH, STATIC_PATH, PORT, HOST } = require("./config");
const fs = require("fs/promises");

const app = express();
app.use(corsMiddleware);

registerRoutes(app);

(async () => {
  await initializeTmpFolder();
  const server = app.listen(PORT, HOST, () => {
    console.log(`Static server is running at http://${HOST}:${PORT}`);
    console.log(`Serving static files from: ${STATIC_PATH}`);
    console.log(`Temporary files are stored in: ${TMP_PATH}`);
  });
  server.on("close", async () => {
    await cleanupTmpFolder();
  });
})();

async function initializeTmpFolder() {
  try {
    await fs.access(TMP_PATH);
  } catch {
    await fs.mkdir(TMP_PATH, { recursive: true });
  }
}

async function cleanupTmpFolder() {
  try {
    await fs.rm(TMP_PATH, { recursive: true, force: true });
    console.log(`Deleted TMP folder: ${TMP_PATH}`);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Error deleting TMP folder: ${err.message}`);
    }
  }
}

process.on("SIGINT", async () => {
  console.log("\nShutting down server...");
  await cleanupTmpFolder();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down server...");
  await cleanupTmpFolder();
  process.exit(0);
});

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await cleanupTmpFolder();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  await cleanupTmpFolder();
  process.exit(1);
});
