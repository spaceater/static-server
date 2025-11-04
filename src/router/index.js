const path = require("path");
const { STATIC_PATH } = require("../../config");
const { isImageFile } = require("../utility/tools");
const { handleFile } = require("../handler/fileHandler");
const { handleImage } = require("../handler/imageHandler");

function registerRoutes(app) {
  app.get("/*", async (req, res) => {
    try {
      const requested_path = req.params[0] || '';
      const file_path = path.join(STATIC_PATH, requested_path);
      if (isImageFile(file_path)) {
        if (!(await handleImage(file_path, req, res))) {
          res.status(404).send("ERROR: " + file_path + " not found.");
        }
      } else {
        if (!(await handleFile(file_path, req, res))) {
          res.status(404).send("ERROR: " + file_path + " not found.");
        }
      }
    } catch (err) {
      console.log("ERROR: Internal Error: " + err.message);
      res.status(500).send("ERROR: Internal Error: " + err.message);
    }
  });
}

module.exports = {
  registerRoutes
};
