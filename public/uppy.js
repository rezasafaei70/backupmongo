
//execute terminal:
//node --experimental-modules ./public/uppy.js

const tus = require('tus-js-client');
const fs = require('fs');
const path = require('path');

const fileName = "P67HiqS8lshD8_2023-06-05T13-18-26.gz";
//const fileName = "3.jpg";

const file = fs.createReadStream(path.resolve(__dirname, fileName));
const size = fs.statSync(path.resolve(__dirname, fileName)).size;

const upload = new tus.Upload(file, {
    endpoint: 'http://127.0.0.1:2000/api/v1/restore/local',
    retryDelays: [0, 1000, 3000, 5000],
    chunkSize: 5 * 1024 * 1024,
    headers: {
        "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFwaV91c2VyXzIwMjMiLCJwYXNzd29yZCI6IkokOHBAVzE5cUxGRDQiLCJpYXQiOjE2ODc1MDU1ODAsImV4cCI6MTY4NzU5MTk4MH0.Sux42J4Y-PewUx60Wg0Q2f_nzINadYEYO_kXnDEKBI8`,
        "pair-key": "test"
    },
    metadata: {
        filename: fileName,
        filetype: 'application/gzip'
        // filename: 'test',
        //filetype: 'image/jpeg',
        // contenttype: 'image/jpeg',
        // mimetype: '.jpg',
        // testmeta: 'something'
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
    },
    onAfterResponse: (data) => {
        console.log(data._request.res.statusMessage)
        if (data._request.res.statusCode == 400 || data._request.res.statusCode == 500) {
            // console.log(data._request.res.statusMessage);
            // console.log(data._request.res.statusCode);
            // upload.abort(true, (err) => {
            // }).then(() => {
            //     console.log(data._request.res.statusCode);
            //     console.log(data._request.res.statusMessage);
            // }).catch((err) => {
            //     // Handle error
            //     console.log("errr")
            // })
        }
    },

})

upload.start();