module.exports = function (app) {
    const common = require('./commonController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/app/:platform', common.getTest);

    app.post('/firebase',jwtMiddleware,common.firebase);
    // Common

};