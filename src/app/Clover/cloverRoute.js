module.exports = function (app) {
    const clover = require('./cloverController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/clover',jwtMiddleware,clover.getClover);

    app.get('/rank',jwtMiddleware,clover.getCloverRank);
    // Clover
    
};