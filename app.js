
const express = require('express');
const rateLimit = require('express-rate-limit');

if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv').config({ path: './.env.save' });
}

const backupScheduler = require('./backupScheduler');
const AppError = require('./utils/appError');
const { create_dir } = require('./utils/appConfig');

const app = express();

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

app.use(create_dir);

app.all('*', (req, res, next) => {
  next(new AppError(`The ${req.originalUrl} can not find on this server!`, 404));
});

const port = process.env.LOCALPORT || 3000;
const server = app.listen(port, () => {
  console.log(`App runnig on port ${port}...`);
});

//? This event is emitted when an unhandled exception occurs
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('uncought exception...');
});

backupScheduler.initialBackup();
backupScheduler.automatedBackup();
