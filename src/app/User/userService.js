const { logger, errLogger, logmessage } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const userDao = require("./userDao");
const baseResponse = require("../../../config/baseResponseStatus");
const { response } = require("../../../config/response");
const { errResponse } = require("../../../config/response");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { connect } = require("http2");

exports.updateMemberCode = async function (teamCode, memberID, companyIdx) {
    try {
        let token = await jwt.sign(
            {
                memberID: memberID,
                companyIdx: companyIdx
            }, // 토큰의 내용(payload)
            secret_config.jwtsecret, // 비밀키
            {
                expiresIn: "365d",
                subject: "Member",
            } // 유효 기간 365일
        );

        return response(baseResponse.SUCCESS, { "jwt": token });
    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), 'jwt 생성', memberID));
        return errResponse(baseResponse.DB_ERROR);
    }
};

exports.memberCodeOut = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        const [Result] = await userDao.deleteMembers(connection, memberID);
        await connection.commit();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), '퇴사 신청', memberID));
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};

exports.updateMypage = async function (params) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        const Result = await userDao.updateMemberInfo(connection, params);
        await connection.commit();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), '멤버 정보 변경', params[5]));
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};
