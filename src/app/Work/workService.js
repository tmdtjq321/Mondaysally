const { logger, errLogger, logmessage } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const workProvider = require("../../app/Work/workProvider");
const workDao = require("./workDao");
const baseResponse = require("../../../config/baseResponseStatus");
const { response } = require("../../../config/response");
const { errResponse } = require("../../../config/response");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { connect } = require("http2");

exports.memberWorkon = async function (idx, companyIdx, status,
                                       currentClover, accumulatedClover) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        // await connection.beginTransaction();

        if (status == 'L') {
            const Result = await workDao.insertWork(connection, idx);
            // await connection.commit();
            connection.release();
            return response(baseResponse.SUCCESS);
        }
        else {
            const [chk] = await workDao.todayWorkOn(connection, idx);
            let tmp = (chk.minute / 60.0).toFixed(2);

            const params = [idx, chk.idx, tmp, companyIdx];
            var value = Math.floor(tmp);
            const insert = await workDao.CloverWork(connection,
                idx, chk.idx, companyIdx, tmp, currentClover + value, accumulatedClover + value);
            // await connection.commit();
            connection.release();
            return response(baseResponse.SUCCESS);
        }
    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), `출퇴근 API ${status}`, idx));
        // await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    }
};

exports.dailyWorkOff = async function () {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        const insert = await workDao.CloverWorkOff(connection);
        await connection.commit();

        return response(baseResponse.SUCCESS,insert);

    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), `자동 퇴근 API ${status}`, idx));
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};
