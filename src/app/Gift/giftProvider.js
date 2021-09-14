const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const giftDao = require("./giftDao");

exports.IDCheck = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [CheckResult] = await giftDao.selectID(connection, memberID);
    connection.release();

    return CheckResult;
};

exports.selectGifInfo = async function (companyIdx, page) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await giftDao.selectGiftlist(connection, companyIdx, page);

    connection.release();

    return result;
};

exports.selectGifInfonyID = async function (giftID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await giftDao.selectGiftbyID(connection, giftID);

    connection.release();

    return result;
};

exports.selectGiftLoglist = async function (memberID, page) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await giftDao.selectGiftLoglists(connection, memberID, page);
    connection.release();

    return result;
};
