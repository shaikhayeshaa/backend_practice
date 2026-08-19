import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDirectory = path.resolve("public/temp");

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename(req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);c

    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  }
});

export const upload = multer({ storage });