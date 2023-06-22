
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv').config({ path: './.env.save.example' });
}

const backupScheduler = require('./backupScheduler');
const AppError = require('./utils/appError');
const uploader = require('./utils/uploaderConfig');

const app = express();

//? tus-uploader
const uploadApp = express();

app.use(cors());

//? access control
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const restoreRouter = require('./routes/restoreRoutes');
const backupRouter = require('./routes/backupRoutes');
const pingRouter = require('./routes/pingRoutes');
const userRoutes = require('./routes/userRoutes');

app.use(express.json());
//console.log(process.env)

//limit requests from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests from this Ip. please try agian in an hour!',
});
app.use('/api', limiter);

app.use('/api/v1/ping', pingRouter);
app.use('/api/v1/restore', restoreRouter);
app.use('/api/v1/backup', backupRouter);
app.use('/api/v1/users', userRoutes);

app.use('/uploads', uploader.uploadAppConfig(uploadApp));

app.all('*', (req, res, next) => {
  next(new AppError(`The ${req.originalUrl} can not find on this server!`, 404));
});

const port = process.env.LOCALPORT || 3000;
app.listen(port, () => {
  console.log(`App runnig on port ${port}...`);
});

//? This event is emitted when an unhandled exception occurs
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('uncought exception...');
});

backupScheduler.initialBackup();
backupScheduler.automatedBackup();
