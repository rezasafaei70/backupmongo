
const express = require('express');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv').config({ path: './config.env' });
const backupScheduler= require('./backupScheduler');
const AppError = require('./utils/appError');
const {create_dir}= require('./utils/appConfig');

const app = express();

const restoreRouter = require('./routes/restoreRoutes');
const backupRouter = require('./routes/backupRoutes');

//console.log(process.env)

//limit requests from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests from this Ip. please try agian in an hour!',
});
app.use('/api', limiter);

app.use('/api/v1/restore', restoreRouter);
app.use('/api/v1/backup', backupRouter);

app.use(create_dir);

app.all('*', (req, res, next) => {
  next(new AppError(`The ${req.originalUrl} can not find on this server!`, 404));
});

const port = process.env.LocalPORT || 3000;
const server = app.listen(port, () => {
  console.log(`App runnig on port ${port}...`);
});

backupScheduler.initialBackup();
backupScheduler.automatedBackup();

//restore(config, 'P67HiqS8lshD8_2023-04-26T10-24-51.gz')
//.then(resolved => {
//  console.log(resolved);
// }, rejected => {
//   console.error(rejected);
// });

// process.on('unhandledRejection', (err) => {
//   console.log(err.name, err.message);
//   console.log('unhandled rejection promise. shutting down server...');
// });
