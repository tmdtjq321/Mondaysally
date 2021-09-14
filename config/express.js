const express = require('express');
const app = express();
const compression = require('compression');
const methodOverride = require('method-override');
const admin = require('firebase-admin');
var cors = require('cors');

module.exports = function () {

    app.use(compression());

    app.use(express.json());

    app.use(express.urlencoded({extended: true}));

    app.use(methodOverride());

    app.use(cors());

    // app.use(express.static(process.cwd() + '/public'));

    /* App (Android, iOS) */
    // TODO: 도메인을 추가할 경우 이곳에 Route를 추가하세요.
    require('../src/app/User/userRoute')(app);
    require('../src/app/Common/commonRoute')(app);
    require('../src/app/Home/homeRoute')(app);
    require('../src/app/Gift/giftRoute')(app);
    require('../src/app/Twinkle/twinkleRoute')(app);
    require('../src/app/Clover/cloverRoute')(app);
    require('../src/app/Work/workRoute')(app);
    // require('../src/app/Board/boardRoute')(app);

    return app;
};