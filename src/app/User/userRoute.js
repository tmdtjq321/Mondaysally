module.exports = function (app) {
    const user = require('./userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.post('/signup', user.postAdmin);

    app.post('/signin', user.login);

    app.post('/SMS/:status', user.postSMS);

    app.patch('/info',jwtMiddleware,user.editAdmin);

    app.patch('/password', user.password);

    app.get('/company',jwtMiddleware,user.companylist);

    app.patch('/company',jwtMiddleware,user.companyUpdate);

    app.get('/department',jwtMiddleware,user.companyDepartment);

    app.post('/department',jwtMiddleware,user.addCompanyDepartment);

    app.patch('/department/:idx',jwtMiddleware,user.delCompanyDepartment);

    app.get('/member',jwtMiddleware,user.CompanyMember);

    app.post('/member',jwtMiddleware,user.postCompanyMember);

    app.get('/member/:idx',jwtMiddleware,user.CompanyMemberByid);

    app.patch('/member/department/:idx',jwtMiddleware,user.CompanyMemberUpdate);

    app.patch('/member/out/:idx',jwtMiddleware,user.CompanyMemberDel);

    app.get('/gift',jwtMiddleware,user.getGift);

    app.post('/gift',jwtMiddleware,user.postGift);

    app.get('/gift/:idx',jwtMiddleware,user.IDbyGift);

    app.patch('/gift',jwtMiddleware,user.updateGift);

    app.patch('/gift/:idx',jwtMiddleware,user.deleteGift);

    app.get('/giftlog',jwtMiddleware,user.giftLogLists);

    app.get('/giftlog/:idx',jwtMiddleware,user.giftLogbyId);

    app.patch('/giftlog',jwtMiddleware,user.updateGiftLog);

    app.get('/clover',jwtMiddleware,user.cloverLists);

};