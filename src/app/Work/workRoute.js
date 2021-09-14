module.exports = function (app) {
    const work = require('./workController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.post('/work',jwtMiddleware,work.workon);

    app.get('/auto-workoff', work.patchWorkOff);
    // Work

};