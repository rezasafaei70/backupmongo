
//? tus-uploader
const { Server, EVENTS } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const { BACKUP_PATH } = require('./../utils/appConfig');
const path = BACKUP_PATH("");
const restoreController = require('./../controllers/restoreController');


const validateMetadata = (upload) => {
    try {
        if (upload.metadata.filetype !== 'application/gzip' && !upload.Upload.metadata.filename.include('.gz')) {
            return {
                status_code: 400,
                body: 'Only .gz files are allowed!'
            };
        }
        return {
            status_code: 200,
            body: 'ok!'
        };
    } catch (error) {
        return {
            status_code: 500,
            body: error.message
        };
    }
}

exports.initialUpload = (uploadApp) => {

    const server = new Server({
        path: '/',
        datastore: new FileStore({ directory: path }),
        onUploadCreate: ((req, res, upload) => {
            const response = validateMetadata(upload);
            if (response.status_code !== 200) {
                res.statusCode = response.status_code;
                res.statusMessage = response.body;
                throw response;
            }
            return res;
        }),
        onUploadFinish: ((req, res, upload) => {
            restoreController.restoreDBFromLocalCopy(upload.id).then((response) => {
                console.log(response.statusCode);
                if (response.statusCode !== 200) {
                    res.statusCode = response.statusCode;
                    res.statusMessage = response.message;

                    throw { status_code: response.statusCode, body: response.message };
                }
                return res;
            });
        })
    }
    );

    uploadApp.all('*', server.handle.bind(server));
    // uploadApp.all('*', (req, res) => {
    //     server.handle(req, res);
    // });

    return uploadApp;
}




