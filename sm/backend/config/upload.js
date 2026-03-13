const multer = require('multer');

// Store files in memory as buffer — converted to base64 and saved in MongoDB
// No disk storage needed, works perfectly on Render/Vercel/any cloud host

const imgFilter = (_req, file, cb) => {
  /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)
    ? cb(null, true)
    : cb(new Error('Images only (jpg, jpeg, png, gif, webp)'));
};

const opts = { storage: multer.memoryStorage(), fileFilter: imgFilter, limits: { fileSize: 5 * 1024 * 1024 } };

const upload = multer(opts);

module.exports = {
  uploadProfile: upload,
  uploadPost:    upload,
  uploadService: upload,
};

// Helper: convert multer memory file to base64 data URL
module.exports.toBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
