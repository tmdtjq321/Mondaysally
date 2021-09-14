module.exports = function (app) {
    const twinkle = require('./twinkleController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/prove',jwtMiddleware,twinkle.getTwinkle);

    app.get('/twinkle',jwtMiddleware,twinkle.getTwinklelist);

    app.post('/twinkle',jwtMiddleware,twinkle.postTwinkle);

    app.post('/like/:idx',jwtMiddleware,twinkle.postTwinkleLike);

    app.get('/twinkle/:idx',jwtMiddleware,twinkle.getTwinkleID);

    app.patch('/twinkle/out/:idx',jwtMiddleware,twinkle.delTwinkleID);

    app.patch('/twinkle/:idx',jwtMiddleware,twinkle.updateTwinkleID);

    app.post('/comment/:idx',jwtMiddleware,twinkle.postComment);

    app.patch('/comment/out/:idx',jwtMiddleware,twinkle.delComment);
    // Twinkle

};