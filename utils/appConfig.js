'use strict';

const path = require('path'),
  fs = require('fs'),
  os = require('os'),
  AWS = require('aws-sdk'),
  moment = require('moment'),
  PROJECT_ROOT = process.mainModule.paths[0].split('node_modules')[0];

exports.BACKUP_PATH = (ZIP_NAME) => path.resolve(os.tmpdir(), ZIP_NAME);
// exports.logFilePath = `${PROJECT_ROOT}/database/temp/backup.txt`;

const config = (exports.config = {
  database: {
    name: process.env.DATABSE,
    type: process.env.DATABASE_TYPE,
    host: process.env.HOST,
    port: process.env.PORT,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
  },
  s3: {
    accessKey: process.env.ACCESSKEY, //AccessKey
    secretKey: process.env.SECRETKEY, //SecretKey
    endpoint: process.env.ENDPOINT, //S3 Bucket Region
    accessPerm: process.env.ACCESSPERM,
    bucketName: process.env.BUCKETNAME,
  },
  keepLocalBackups: false, //If true, It'll create a folder in project root with database's name and store backups in it and if it's false, It'll use temporary directory of OS.
  noOfLocalBackups: 2, //This will only keep the most recent 5 backups and delete all older backups from local backup directory
  timezoneOffset: 300, //Timezone, Used in naming backups, It is assumed to be in hours if less than 16 and in minutes otherwise

  deleteStorageBackups: process.env.DELETE_STORAGE_BACKUPS === 'true', //Enable or Disable
  daysAgoDeleteStorageBackups: process.env.DAYS_AGO_DELETE_STORAGE_BACKUPS, //Deleting backups of a few days ago on Storage
});

// Checks provided Configuration, Rejects if important keys from config are
// missing
exports.validateConfig = () => {
  if (
    !config ||
    !config.database ||
    !config.database.name ||
    !config.database.type ||
    (!config.database.host && !config.database.hosts[0]?.host) ||
    (!config.database.port && !config.database.hosts[0]?.port) ||
    !config.s3 ||
    !config.s3.accessKey ||
    !config.s3.secretKey ||
    !config.s3.endpoint ||
    !config.s3.bucketName
  ) {
    return false;
  }

  //   else if (config.mongodb.database && config.mongodb.hosts[0].host && config.mongodb.hosts[0].port) {

  //     mongodb = {
  //         scheme: 'mongodb',
  //         username: config.mongodb.username || null,
  //         password: config.mongodb.password || null,
  //         database: config.mongodb.database,
  //         hosts: [{
  //             host: config.mongodb.hosts[0].host,
  //             port: config.mongodb.hosts[0].port
  //         }]
  //     };
  // }

  const database = {
    type: config.database.type,
    username: config.database.username || null,
    password: config.database.password || null,
    name: config.database.name,
    hosts: [
      {
        host: config.database.host || config.database.hosts[0]?.host,
        port: config.database.port || config.database.hosts[0]?.port,
      },
    ],
  };

  if (config.keepLocalBackups) {
    fs.mkdir(path.resolve(PROJECT_ROOT, database.name), (err) => {
      if (err) {
        // Do nothing
      }
    });
    BACKUP_PATH = (ZIP_NAME) => path.resolve(PROJECT_ROOT, database.name, ZIP_NAME);
  }

  // Replace Connection URI with parsed output from uri
  config.database = database;
  console.log(config.database);
  create_dir();

  return true;
};

exports.AWSSetup = () => {
  AWS.config.update({
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
    endpoint: config.s3.endpoint,
  });

  return new AWS.S3();
};

// Gets current time If Timezoneoffset is provided, then it'll get time in that
// time zone If no timezone is provided, then it gives UTC Time
exports.currentTime = (timezoneOffset) => {
  if (timezoneOffset) {
    return moment(moment(moment.now()).utcOffset(timezoneOffset, true).toDate()).format('YYYY-MM-DDTHH-mm-ss');
  } else {
    return moment.utc().format('YYYY-MM-DDTHH-mm-ss');
  }
};

const create_dir = (exports.create_dir = () => {
  const dir = `${PROJECT_ROOT}/database/temp/`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }
  return dir;
});

exports.Provider = {
  mongodb: 'mongodb',
  postgresql: 'postgresql',
};
