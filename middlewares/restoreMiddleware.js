
const uploaderConfig = require('./../utils/uploaderConfig');
const authController = require('./../controllers/authController');
const restoreController = require('./../controllers/restoreController');

const restoreMiddleware = (uploadApp) => {
    return [
        authController.protect,
        restoreController.permissionRestorer,
        uploaderConfig.initialUpload(uploadApp),
        //restoreController.restoreDBFromLocalCopy
    ];
}

module.exports = restoreMiddleware;