const { logger, errLogger, logmessage } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const twinkleDao = require("./twinkleDao");
const baseResponse = require("../../../config/baseResponseStatus");
const { response } = require("../../../config/response");
const { errResponse } = require("../../../config/response");

const { connect } = require("http2");
const FCMadmin = require("../../../config/FCM");

exports.postTwinkles = async function (memberID, giftLogIdx, content,
                                       receiptImgUrl, twinkleImgList) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        const [chk] = await twinkleDao.selectTwinklebyLogID(connection, giftLogIdx);

        if (chk)
            return errResponse(baseResponse.SIGNUP_GIFTLOG_ALREADY);

        const params = [memberID, giftLogIdx, content, receiptImgUrl];
        const Row = await twinkleDao.insertTwinkle(connection, params);
        const logUpdate = await twinkleDao.updateGiftLogProved(connection, giftLogIdx);

        var pa = [];
        for (let i = 0; i < twinkleImgList.length; i++) {
            const data = [Row[0].insertId, twinkleImgList[i]];
            pa.push(data);
        }

        const Rows = await twinkleDao.insertTwinkleImg(connection, pa);
        await connection.commit();

        return response(baseResponse.SUCCESS);

    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), '트윙클 등록', memberID));
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};

exports.postTwinklelikes = async function (isAos,token,name, twinkleID, memberID) {

    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        const params = [twinkleID, memberID];

        const [chk] = await twinkleDao.twinkleLikechk(connection, params);

        if (chk) {
            var updateStatus = '';
            if (chk.status == 'ACTIVE') {
                updateStatus = 'INACTIVE';
            }
            else {
                updateStatus = 'ACTIVE';
                FCMadmin.fcm(token,'트윙클',`${name}님이 내 트윙클을 좋아해요!`);
            }
            const p = [updateStatus, twinkleID, memberID];
            const update = await twinkleDao.updateTwinkleLike(connection, p);
        }
        else {
            const insert = await twinkleDao.insertTwinkleLike(connection, params);
            FCMadmin.fcm(token,'트윙클',`${name}님이 내 트윙클을 좋아해요!`);
        }
        await connection.commit();

        return response(baseResponse.SUCCESS);

    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), '좋아요 등록/취소', memberID));
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};

exports.delTwinklebyID = async function (twinkleID) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        const update = await twinkleDao.deltwinkle(connection, twinkleID);
        await connection.commit();
        return response(baseResponse.SUCCESS);

    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), '삭제 트윙클 Idx', twinkleID));
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};

exports.updateTwinklebyID = async function (status, twinkleID, content, receiptImgUrl, updateTwinkleImgList) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        if (status == 'Y') {
            const pa = [content, twinkleID];
            const update = await twinkleDao.updateContentTwinkle(connection, pa);
            await connection.commit();

            return response(baseResponse.SIGNUP_ADMIN_NOWON);
        }

        const params = [content, receiptImgUrl, twinkleID];
        const Row = await twinkleDao.updateTwinkle(connection, params);

        var imgChk = await twinkleDao.twinkleImgChk(connection, twinkleID);

        if (imgChk.length < updateTwinkleImgList.length) {
            for (let i = 0; i < imgChk.length; i++) {
                const parameter = [updateTwinkleImgList[i], imgChk[i].idx];
                const updates = await twinkleDao.updateTwinkleImg(connection, parameter);
            }
            var p = [];
            for (let i = imgChk.length; i < updateTwinkleImgList.length; i++) {
                const pa = [twinkleID, updateTwinkleImgList[i]];
                p.push(pa);
            }

            const insert = await twinkleDao.insertTwinkleImg(connection, p);
        }
        else {
            for (let i = 0; i < updateTwinkleImgList.length; i++) {
                const pa = [updateTwinkleImgList[i], imgChk[i].idx];
                const updates = await twinkleDao.updateTwinkleImg(connection, pa);
            }
            for (let i = updateTwinkleImgList.length; i < imgChk.length; i++) {
                const deletes = await twinkleDao.delTwinkleImg(connection, imgChk[i].idx);
            }
        }

        await connection.commit();
        return response(baseResponse.SUCCESS);

    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), '수정 트윙클 Idx', twinkleID));
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};

exports.insertComment = async function (isAos,token,name,twinkleIdx, memberID, content) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        const params = [twinkleIdx, memberID, content];

        const insert = await twinkleDao.insertComment(connection, params);
        FCMadmin.fcm(token,"트윙클",`${name}님이 내 트윙클에 댓글을 남겼어요!`)

        await connection.commit();
        return response(baseResponse.SUCCESS);
    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), '댓글 생성',memberID))
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};

exports.delComment = async function (memberID, commentId) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        const [chk] = await twinkleDao.commentchk(connection, commentId);

        if (!chk)
            return errResponse(baseResponse.SIGNUP_COMMENT_NONE);

        if (chk.status != 'N')
            return errResponse(baseResponse.SIGNUP_COMMENT_DEL);

        if (chk.memberIdx != memberID)
            return errResponse(baseResponse.SIGNUP_COMMENT_AUTHOR);

        const row = await twinkleDao.deleteComment(connection, commentId);
        await connection.commit();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err), '댓글 삭제',memberID))
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};
