const multer = require("multer");

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

function pdfFileFilter(req, file, cb) {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExtension = /\.pdf$/i.test(file.originalname || "");
  if (isPdfMime || isPdfExtension) {
    return cb(null, true);
  }
  cb(new Error("Only PDF files are allowed"));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: pdfFileFilter,
});

function verifyPdfContent(req, res, next) {
  if (req.file?.buffer) {
    const head = req.file.buffer.subarray(0, 1024).toString("latin1");
    if (!head.includes("%PDF-")) {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }
  }
  next();
}

module.exports = { upload, verifyPdfContent };
