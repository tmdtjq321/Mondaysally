module.exports = function (app) {
    const gift = require('./giftController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/gift',jwtMiddleware,gift.getGiftlist);

    app.get('/gift/:idx',jwtMiddleware,gift.getGiftbyID);

    app.post('/gift',jwtMiddleware,gift.postGiftOrder);

    app.get('/giftlog',jwtMiddleware,gift.getGiftLog);
    // Gift

};