module.exports = function (app) {
    const user = require('./userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    // 1. 관리자 (회원가입) API
    app.post('/signup', user.postAdmin);

    // 2. 관리자 로그인 하기 API (JWT 생성)
    app.post('/signin', user.login);

    // SMS
    app.post('/SMS/:status', user.postSMS);

    app.patch('/info',jwtMiddleware,user.editAdmin);

    app.post('/password', user.password);

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

    app.get('/giftlog',jwtMiddleware,user.giftLogLists);

    app.get('/giftlog/:idx',jwtMiddleware,user.giftLogbyId);

    app.patch('/giftlog',jwtMiddleware,user.updateGiftLog);



};