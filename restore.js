const path = require('path'),
  fs = require('fs'),
  exec = require('child_process').exec;

const { config, BACKUP_PATH, AWSSetup, validateConfig, Provider } = require('./utils/appConfig');

//? 5. restore db
const restoreDatabase = (ZIP_NAME) => {
  return new Promise((resolve, reject) => {
    // Backups are stored in .tmp directory in Project root
    fs.mkdir(path.resolve('.tmp'), (err) => {
      if (err && err.code != 'EEXIST') {
        reject({
          error: 1,
          status: 'fail',
          statusCode: 400,
          message: err.message,
        });
      } else {
        fs.readFile(BACKUP_PATH(`${ZIP_NAME}`), 'utf-8', (err, data) => {
          if (err) {
            return reject({
              error: 1,
              status: 'fail',
              statusCode: 400,
              message: 'Not Found File!',
            });
          }

          return deleteDatabase().then(
            (result) => {
              const name = config.database.name,
                type = config.database.type,
                password = config.database.password || null,
                username = config.database.username || null,
                host = config.database.hosts[0].host || null,
                port = config.database.hosts[0].port || null;

              let command;
              if (type === Provider.mongodb) {
                const baseCommand = `mongorestore --gzip --archive=${BACKUP_PATH(ZIP_NAME)} -h ${host} --port=${port}`;
                if (username && password) {
                  command = `${baseCommand} -u ${username} -p ${password} --authenticationDatabase admin`;
                } else if (username) {
                  command = `${baseCommand} -u ${username}`;
                } else {
                  command = baseCommand;
                }
              } else if (type === Provider.postgresql) {
                const baseCommand = `pg_restore -h ${host} -p ${port} -d ${name} ${BACKUP_PATH(ZIP_NAME)}`;
                if (username && password) {
                  command = `PGPASSWORD="${password}" createdb -h ${host} -p ${port} -U ${username} ${name} && PGPASSWORD="${password}" ${baseCommand} -U ${username}`;
                } else if (username) {
                  command = `createdb -h ${host} -p ${port} -U ${username} ${name} && ${baseCommand} -U ${username}`;
                } else {
                  command = `createdb -h ${host} -p ${port} ${name} && ${baseCommand}`;
                }
              } else {
                return {
                  error: 1,
                  status: 'fail',
                  statusCode: 400,
                  message: 'Invalid database provider.',
                };
              }

              exec(command, (err, stdout, stderr) => {
                if (err) {
                  // Most likely, restore isn't installed or isn't accessible
                  console.error(err.message);
                  reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 400,
                    message: 'It is not possible to execute the restore command',
                  });
                } else {
                  resolve({
                    error: 0,
                    status: 'success',
                    message: 'Successfuly Created Restore',
                    backupName: ZIP_NAME,
                  });
                }
              });
            },
            (error) => {
              reject(error);
            }
          );
        });
      }
    });
  });
};

//? 4. delete current db for restore
const deleteDatabase = () => {
  const name = config.database.name,
    type = config.database.type,
    password = config.database.password || null,
    username = config.database.username || null,
    host = config.database.hosts[0].host || null,
    port = config.database.hosts[0].port || null;

  let command;

  if (type === Provider.mongodb) {
    const baseCommand = `mongosh --host ${host}:${port} ${name} --eval "db.dropDatabase()"`;
    if (username && password) {
      command = `mongosh --host ${host}:${port} -u ${username} -p ${password} --authenticationDatabase admin ${name} --eval "db.dropDatabase()"`;
    } else if (username) {
      command = `mongosh --host ${host}:${port} -u ${username} ${name} --eval "db.dropDatabase()"`;
    } else {
      command = baseCommand;
    }
  } else if (type === Provider.postgresql) {
    const baseCommand = `dropdb --force -h ${host} -p ${port} ${name}`;
    if (username && password) {
      command = `PGPASSWORD="${password}" ${baseCommand} -U ${username}`;
    } else if (username) {
      command = `${baseCommand} -U ${username}`;
    } else {
      command = baseCommand;
    }
  } else {
    return {
      error: 1,
      status: 'fail',
      statusCode: 400,
      message: 'Invalid database provider.',
    };
  }

  return new Promise(
    (resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err && err.code !== 1) {
          console.error(err.message);
          reject({
            error: 1,
            status: 'fail',
            statusCode: 400,
            message: 'It is not possible to execute the delete command',
          });
        } else {
          resolve({
            error: 0,
            status: 'success',
            message: 'Database deleted successfully!',
          });
        }
      });
    },
    (error) => {
      reject({
        error: 1,
        status: 'error',
        statusCode: 500,
        message: error.message,
      });
    }
  );
};

//? 3. call restore
const restore = (downloadResult) => {
  // Restore Database
  return restoreDatabase(downloadResult.data).then(
    (result) => {
      return Promise.resolve({
        error: 0,
        status: 'success',
        message: 'The database was restored successfully!',
      });
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

//? 2.download from s3
const downloadFileFromS3 = (S3, ZIP_NAME) => {
  return new Promise(
    (resolve, reject) => {
      let downloadParams = {
        Bucket: config.s3.bucketName,
        Key: ZIP_NAME,
      };
      const stream = S3.getObject(downloadParams).createReadStream();
      const writeStream = fs.createWriteStream(BACKUP_PATH(ZIP_NAME));

      stream.on('end', () => {
        resolve({
          error: 0,
          status: 'success',
          message: 'Download Successful',
          data: ZIP_NAME,
        });
      });

      stream.on('error', (err) => {
        if (err.code === 'NoSuchKey') {
          return reject({
            error: 1,
            status: 'fail',
            statusCode: 404,
            message: 'The file not found!',
          });
        }

        return reject({
          error: 1,
          status: 'fail',
          statusCode: 400,
          message: err.message,
        });
      });

      stream.pipe(writeStream);
    },
    (error) => {
      reject({
        error: 1,
        status: 'error',
        statusCode: 500,
        message: error.message,
      });
    }
  );
};

//? 1.download file
const downloadBackup = (ZIP_NAME) => {
  let s3 = AWSSetup();
  return downloadFileFromS3(s3, ZIP_NAME).then(
    (downloadFileResult) => {
      return Promise.resolve(downloadFileResult);
    },
    (downloadFileError) => {
      if (downloadFileError) {
        return Promise.reject(downloadFileError);
      }
    }
  );
};

//? First, the file is downloaded from the uploaded path on the cloud,
//? then the current database is deleted,
//? and finally the received file is restored.

exports.restore = (ZIP_NAME) => {
  // Check if the configuration is valid
  let isValidConfig = validateConfig();
  if (!isValidConfig) {
    return Promise.reject({
      error: 1,
      status: 'fail',
      statusCode: 400,
      message: 'Invalid Configuration',
    });
  }
  // download a backup of database
  return downloadBackup(ZIP_NAME).then(
    (downloadResult) => {
      // delete current db and restore
      return restore(downloadResult).then(
        (res) => {
          return Promise.resolve(res);
        },
        (err) => {
          return Promise.reject(err);
        }
      );
    },
    (downloadResult) => {
      return Promise.reject(downloadResult);
    }
  );
};

exports.restoreFromLocalCopy = (ZIP_NAME) => {
  // Check if the configuration is valid
  let isValidConfig = validateConfig();
  if (!isValidConfig) {
    return Promise.reject({
      error: 1,
      status: 'fail',
      statusCode: 400,
      message: 'Invalid Configuration',
    });
  }
  // delete current db and restore
  return restoreDatabase(ZIP_NAME).then(
    (restoreDatabaseResponse) => {
      return Promise.resolve(restoreDatabaseResponse);
    },
    (restoreDatabaseError) => {
      return Promise.reject(restoreDatabaseError);
    }
  );
};
