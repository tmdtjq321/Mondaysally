const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const twinkleDao = require("./twinkleDao");

exports.IDCheck = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [CheckResult] = await twinkleDao.selectID(connection, memberID);
    connection.release();

    return CheckResult;
};

exports.selectTwinkleProve = async function (page, memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const params = [memberID, (page - 1) * 20];
    const result = await twinkleDao.selectTwinkleProveList(connection, params);

    connection.release();

    return result;
};

exports.selectTwinkleList = async function (memberID, page, companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const params = [memberID, companyIdx, (page - 1) * 20];
    const result = await twinkleDao.selectTwinkleList(connection, params);

    connection.release();

    return result;
};

exports.giftLogChk = async function (giftLogIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [result] = await twinkleDao.selectGiftLogID(connection, giftLogIdx);

    connection.release();

    return result;
};

exports.twinkleCheck = async function (twinkleID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [twinklechk] = await twinkleDao.twinklechk(connection, twinkleID);

    connection.release();

    return twinklechk;
};

exports.selectTwinklebyID = async function (twinkleIdx, memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await twinkleDao.selectTwinklebyID(connection, twinkleIdx, memberID);

    connection.release();

    return result;
};

