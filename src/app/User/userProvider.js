const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const userDao = require("./userDao");

exports.IDCheck = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [CheckResult] = await userDao.selectID(connection, memberID);
    connection.release();

    return CheckResult;
};

exports.codeCheck = async function (teamCode) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [Result] = await userDao.chkCode(connection, teamCode);
    connection.release();

    return Result;
};

exports.memberMypage = async function (idx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [Result] = await userDao.selectMypage(connection, idx);
    connection.release();

    return Result;
};