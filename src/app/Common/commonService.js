const { logger, errLogger, logmessage } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const commonDao = require("./commonDao");
const baseResponse = require("../../../config/baseResponseStatus");
const { response } = require("../../../config/response");
const { errResponse } = require("../../../config/response");

const jwt = require("jsonwebtoken");
const { connect } = require("http2");

exports.insertToken = async function (memberID, token, isAos) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        const Params = [token, isAos, memberID];
        const userIdResult = await commonDao.updateToken(connection, Params);

        await connection.commit();
        return response(baseResponse.SUCCESS);
    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), 'firebase 토큰 저장',memberID));
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};