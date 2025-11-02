const path = require("path");
const fsPromises = require("fs").promises;
const sharp = require("sharp");
const { fileExists } = require("../utility/tools");

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
  convertAndStoreImage
};
