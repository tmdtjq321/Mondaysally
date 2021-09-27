const mysql = require('mysql2/promise');
const {logger} = require('./winston');

// TODO: 본인의 DB 계정 입력
const pool = mysql.createPool({
    host: 'mondaysallydatabase.cac7s5ecpj9r.ap-northeast-2.rds.amazonaws.com',
    user: 'lawofsally',
    port: '3306',
    password: 'sally0630!!',
    database: 'Mondaysally',
    charset: 'utf8mb4'
});

module.exports = {
    pool: pool
};