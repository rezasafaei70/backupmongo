
//execute terminal:
//node --experimental-modules ./public/uppy.js

const tus = require('tus-js-client');
const fs = require('fs');
const path = require('path');

const fileName = "P67HiqS8lshD8_2023-06-05T13-18-26.gz";

const file = fs.createReadStream(path.resolve(__dirname, fileName));
const size = fs.statSync(path.resolve(__dirname, fileName)).size;

var upload;

upload = new tus.Upload(file, {
    endpoint: 'http://127.0.0.1:2000/uploads',
    retryDelays: [0, 1000, 3000, 5000],
    headers: {
        // "Authorization": `Bearer ${keycloak.token}`,
    },
    metadata: {
        filename: fileName,
        filetype: 'application/gzip'
    },
    onError: function (error) {
        console.log("Failed because: " + error)
    },
    onProgress: function (bytesUploaded, bytesTotal) {
        let percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        console.log(bytesUploaded, bytesTotal, percentage + "%")
    },
    onSuccess: function () {
        console.log("Download %s from %s", upload.file.name, upload.url)
    }
})

upload.start();