const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const mkDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
mkDir('uploads/profiles');
mkDir('uploads/posts');
mkDir('uploads/services');

const storage = (folder) => multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, `uploads/${folder}`),
  filename:    (_req, file, cb) => {
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, name);
  },
});

const imgFilter = (_req, file, cb) => {
  /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname) ? cb(null, true) : cb(new Error('Images only'));
};

const opts = (folder, max = 5 * 1024 * 1024) => ({ storage: storage(folder), fileFilter: imgFilter, limits: { fileSize: max } });

module.exports = {
  uploadProfile: multer(opts('profiles')),
  uploadPost:    multer(opts('posts', 10 * 1024 * 1024)),
  uploadService: multer(opts('services', 10 * 1024 * 1024)),
};
