
//? tus-uploader
const { Server, EVENTS } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const { BACKUP_PATH } = require('./../utils/appConfig');
const uploadPath = BACKUP_PATH("");
const fs = require('fs');
const path = require('path');


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

const deleteUploadedFile = (file) => {
    fs.unlink(path.resolve(uploadPath, file), (err) => {
        if (err)
            console.error(err);
        return;
    });
}

exports.initialUpload = (uploadApp) => {

    const server = new Server({
        path: '/',
        datastore: new FileStore({ directory: uploadPath }),
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
            setTimeout(() => {
                deleteUploadedFile(upload.id);
            }, 20 * 60 * 1000);
        })
    }
    );

    uploadApp.all('*', server.handle.bind(server));
    // uploadApp.all('*', (req, res) => {
    //     server.handle(req, res);
    // });

    return uploadApp;
}





