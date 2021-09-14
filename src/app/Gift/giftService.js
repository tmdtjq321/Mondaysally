const { logger, errLogger, logmessage } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const giftDao = require("./giftDao");
const baseResponse = require("../../../config/baseResponseStatus");
const { response } = require("../../../config/response");
const { errResponse } = require("../../../config/response");

exports.postGiftOrders = async function (currentClover, giftIdx, usedClover, memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();
        const [giftChk] = await giftDao.Giftchk(connection, giftIdx);

        if (!giftChk)
            return errResponse(baseResponse.SIGNUP_GIFT_NONE);

        const [chk] = await giftDao.GiftLogCount(connection, memberID);
        var num = 0;

        if (chk.totalClover) {
            num = parseInt(chk.totalClover);
        }

        if (currentClover >= num + usedClover) {
            const param = [giftIdx, usedClover, memberID];
            const Row = await giftDao.insertGiftApply(connection, param);
            await connection.commit();

            return response(baseResponse.SUCCESS, { 'idx': Row.insertId, 'name': giftChk.name, 'clover': usedClover });
        }
        else {
            return errResponse(baseResponse.SIGNUP_GIFTCLOVER_WRONG);
        }

    } catch (err) {
        errLogger.error(logmessage('err! ' + JSON.stringify(err),'기프트 신청',memberID));
        await connection.rollback();
        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
};

