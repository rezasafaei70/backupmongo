
//? tus-uploader
const { Server, EVENTS } = require('@tus/server');
const { FileStore } = require('@tus/file-store');

exports.uploadAppConfig = (uploadApp) => {

    const server = new Server({
        path: '/database',
        datastore: new FileStore({ directory: './database' }),
    });

    uploadApp.all('*', server.handle.bind(server));

    server.on(EVENTS.POST_FINISH, (upload => {
        console.log(`Upload complete for file ${upload.url}`);
    }));

    server.on(EVENTS.POST_CREATE, (upload => {
        console.error({ upload });
        console.log(`herer werer`);
    }));

    return uploadApp;
}


