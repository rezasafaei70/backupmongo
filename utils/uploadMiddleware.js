const multer = require('multer');
const {BACKUP_PATH} = require('./../utils/appConfig');
const AppError = require('./../utils/appError');

const multerStroge = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, BACKUP_PATH(""))
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })

const multerFilter = (req, file, cb) => {
  if (file.mimetype === 'application/gzip') {
    cb(null, true);
  }
  else {
    cb(new AppError('Only .gz files are allowed!' ,400), false);
  }
};

//? upload on local directory, limit .gz file and 2G size
module.exports = multer({ storage: multerStroge, fileFilter: multerFilter , limits: { fileSize: 2147483648 } });