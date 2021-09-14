const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const homeDao = require("./homeDao");

exports.IDCheck = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [CheckResult] = await homeDao.selectID(connection, memberID);
    connection.release();

    return CheckResult;
};

exports.getGiftHistory = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await homeDao.getGiftHistory(connection, memberID);

    connection.release();

    return result;
};

exports.getRank = async function (companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await homeDao.getRank(connection,companyIdx);

    connection.release();

    return result;
};

exports.getHome = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await homeDao.selectHome(connection, memberID);

    connection.release();

    return result;
};
