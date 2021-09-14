const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const cloverDao = require("./cloverDao");

exports.IDCheck = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [CheckResult] = await cloverDao.selectID(connection, memberID);
    connection.release();

    return CheckResult;
};

exports.selectCloverList = async function (currentClover, type, page, memberID, companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);

    if (type == 'accumulate') {
        const params = [memberID, (page - 1) * 20];
        console.log(params);
        const result = await cloverDao.accumulateCloverList(connection, params);
        connection.release();

        return result;
    }
    else if (type == 'used') {
        const params = [memberID, (page - 1) * 20];
        const result = await cloverDao.usedCloverList(connection, params);
        connection.release();

        return result;
    }
    else {
        const params = [currentClover, companyIdx, (page - 1) * 20];
        const result = await cloverDao.selectCanUseClover(connection, params);
        connection.release();

        return result;
    }
};

exports.selectCloverRank = async function (page,companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await cloverDao.selectCloverRank(connection, page,companyIdx);
    connection.release();

    return result;
};
