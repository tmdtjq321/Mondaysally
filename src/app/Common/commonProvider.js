const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const commonDao = require("./commonDao");

exports.IDCheck = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [CheckResult] = await commonDao.selectID(connection, memberID);
    connection.release();

    return CheckResult;
};

exports.chkServer = async function (platform) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [Result] = await commonDao.selectVersionPlatform(connection);
    connection.release();

    return Result;
};