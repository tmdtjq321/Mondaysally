const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const workDao = require("./workDao");

exports.IDCheck = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [CheckResult] = await workDao.selectID(connection, memberID);
    connection.release();

    return CheckResult;
};