import multer from "multer";
import os from "os";

// Error in vercel
// const uploadDirectory = path.resolve("public/temp");
// fs.mkdirSync(uploadDirectory, { recursive: true });

// uses operating system temp folder
const uploadDirectory = os.tmpdir();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename(req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  }
});

export const upload = multer({ storage });
