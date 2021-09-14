module.exports = function (app) {
    const home = require('./homeController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/main',jwtMiddleware,home.getMain);
    // Home
};