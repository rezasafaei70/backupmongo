const backup = require('./../backup');
const { config, read_file, write_file , create_dir } = require('./../utils/appConfig')

exports.backupDB = (req, res, next) => {
    backup(config).then(resolved => {
        var dir = create_dir();
        write_file(dir, resolved);
        res.status(200).json({
            status: 'success',
            message: resolved.message
        });

    }, rejected => {
        console.error(rejected);
        res.status(500).json({
            status: 'error',
            message: rejected.message
        });
    });
}

exports.directory = (req, res, next) => {
    read_file().then(resolved => {
        res.status(200).json({
            status: 'success',
            data: {data:resolved}
        });

    }, rejected => {
        console.error(rejected);
        res.status(500).json({
            status: 'error',
            message: rejected
        });
    });
}

