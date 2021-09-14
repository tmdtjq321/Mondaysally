module.exports = function (app) {
    const user = require('./userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/auto-login', jwtMiddleware, user.check);
    
    app.post('/code',user.teamCodeUser);

    app.post('/out',jwtMiddleware,user.companyOut);

    app.get('/mypage',jwtMiddleware,user.myPage);

    app.patch('/profile',jwtMiddleware,user.updateInfo);
    // User
};