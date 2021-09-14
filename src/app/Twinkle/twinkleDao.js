async function selectID(connection, memberID) {
    const Query = `
        select Member.idx,Member.nickname, Member.status, Company.status as companyStatus from Member
        join Company on Company.idx = Member.companyIdx where Member.idx = ?;
    `;
    const [resultRow] = await connection.query(Query, memberID);

    return resultRow;
}

async function selectTwinkleProveList(connection, params) {
    const Query = `
        select GiftLog.idx, imgUrl, name, GiftLog.isProved, GiftLog.usedClover from Gift
        join GiftLog on GiftLog.giftIdx = Gift.idx
        where GiftLog.memberIdx = ? and GiftLog.status = 'ACTIVE'
        order by GiftLog.isProved, GiftLog.updatedAt desc limit ?, 20;
    `;

    const [Row] = await connection.query(Query, params);

    return Row;
}

async function selectTwinkleList(connection, params) {
    const Query = `
        select Twinkle.idx, Member.imgUrl, Member.nickname, Gift.name, GiftLog.usedClover, 
               TwinkleImg.imgUrl AS twinkleImg, TwinkleLike.status as isHearted,
               date_format(Twinkle.createdAt, '%Y.%m.%d') as date, Twinkle.content, 
            A.likenum, B.commentnum from Member
            join Twinkle on Twinkle.memberIdx = Member.idx
            join TwinkleImg on Twinkle.idx = TwinkleImg.twinkleIdx
            and TwinkleImg.status = 'ACTIVE'
            join GiftLog on GiftLog.idx = Twinkle.giftLogIdx
            join Gift on Gift.idx = GiftLog.giftIdx
            left join TwinkleLike on TwinkleLike.twinkleIdx = Twinkle.idx
            and TwinkleLike.status = 'ACTIVE' and TwinkleLike.memberIdx = ?
            left join (select twinkleIdx, count(idx)
            as likenum from TwinkleLike
            where TwinkleLike.status = 'ACTIVE' group by TwinkleLike.twinkleIdx)
            as A on Twinkle.idx = A.twinkleIdx
            left join (select twinkleIdx, count(idx)
            as commentnum from Comment
            where Comment.status = 'N' group by Comment.twinkleIdx)
            as B on B.twinkleIdx = Twinkle.idx
        where Member.companyIdx = ? and Twinkle.status = 'ACTIVE'
        group by Twinkle.idx order by Twinkle.createdAt desc limit ?, 20;
    `;

    const [Row] = await connection.query(Query, params);
    for (let i = 0; i < Row.length; i++) {
        if (!Row[i].isHearted || Row[i].isHearted != 'ACTIVE') {
            Row[i].isHearted = 'N';
        }
        else {
            Row[i].isHearted = 'Y';
        }
        if (!Row[i].likenum) {
            Row[i].likenum = 0;
        }

        if (!Row[i].commentnum) {
            Row[i].commentnum = 0;
        }
    }

    return { 'twinkles': Row };
}

async function selectGiftLogID(connection, giftLogIdx) {
    const Query = `select * from GiftLog where idx = ?;`;

    const [Row] = await connection.query(Query, giftLogIdx);
    return Row;
}

async function twinklechk(connection, ID) {
    const Query = `
        select Twinkle.idx, Twinkle.giftLogIdx,
               Twinkle.memberIdx,Twinkle.content,Twinkle.receiptImgUrl,
               Twinkle.createdAt, Twinkle.updatedAt, Twinkle.status,
               GiftLog.isAccepted, Member.firebaseToken, Member.isAos from Twinkle
               join Member on Member.idx = Twinkle.memberIdx
               join GiftLog on Twinkle.giftLogIdx = GiftLog.idx where Twinkle.idx = ?;
    `;

    const [Row] = await connection.query(Query, ID);
    return Row;
}

async function selectTwinklebyID(connection, twinkleIdx, memberID) {
    const Query = `
        select Twinkle.memberIdx, Member.nickname,
               date_format(Twinkle.createdAt,'%Y.%m.%d') as createdAt, TwinkleImg.imgUrl,
               Twinkle.receiptImgUrl, Twinkle.content, Gift.name, GiftLog.usedClover, GiftLog.isAccepted
        from Twinkle join TwinkleImg on Twinkle.idx = TwinkleImg.twinkleIdx
        and TwinkleImg.status = 'ACTIVE'
                     join Member on Member.idx = Twinkle.memberIdx
                     join GiftLog on GiftLog.idx = Twinkle.giftLogIdx
                     join Gift on Gift.idx = GiftLog.giftIdx
        where Twinkle.idx = ?;
    `;

    const Query2 = `
        select TwinkleLike.twinkleIdx, TwinkleLike.memberIdx
        from TwinkleLike where TwinkleLike.twinkleIdx = ?
                           and TwinkleLike.status = 'ACTIVE';
    `;

    const Query3 = `
        select Comment.idx, Comment.memberIdx, Comment.twinkleIdx, Member.nickname as commentWriterName,
               Member.imgUrl as commentWriterImg, Comment.content as commentContent,
               date_format(Comment.createdAt, '%Y.%m.%d') as commentCreatedAt
        from Comment left join Member on Member.idx = Comment.memberIdx and
                                         (Member.status = 'W' or Member.status = 'L')
        where Comment.twinkleIdx = ? and Comment.status = 'N';
    `;
    var obj = {};
    const [Row] = await connection.query(Query, twinkleIdx);
    const [Row2] = await connection.query(Query2, twinkleIdx);
    const [Row3] = await connection.query(Query3, twinkleIdx);
    obj.isWriter = 'N';
    if (Row[0].memberIdx == memberID) {
        obj.isWriter = 'Y';
    }
    obj.writerName = Row[0].nickname;
    obj.twinkleCreatedAt = Row[0].createdAt;
    obj.twinkleImglists = [];
    obj.content = Row[0].content;
    obj.giftName = Row[0].name
    obj.option = Row[0].usedClover
    obj.isAccepted = Row[0].isAccepted;
    obj.receiptImgUrl = Row[0].receiptImgUrl;
    for (let i = 0; i < Row.length; i++) {
        obj.twinkleImglists.push(Row[i].imgUrl);
    }
    obj.likeNum = Row2.length;
    obj.isHearted = 'N';
    for (let i = 0; i < Row2.length; i++) {
        if (Row2[i].memberIdx == memberID) {
            obj.isHearted = 'Y';
            break;
        }
    }
    obj.commentNum = Row3.length;
    for (let i = 0; i < Row3.length; i++) {
        if (Row3[i].memberIdx == memberID) {
            Row3[i].isCommentWrited = 'Y';
        }
        else {
            Row3[i].isCommentWrited = 'N';
        }
        delete Row3[i].memberIdx;
        delete Row3[i].twinkleIdx;
    }
    obj.commentLists = Row3;

    return obj;
}

async function selectTwinklebyLogID(connection, giftLogIdx) {
    const Query = `select * from Twinkle where giftLogIdx = ? and status = 'ACTIVE';`;

    const [Row] = await connection.query(Query, giftLogIdx);
    return Row;
}

async function insertTwinkle(connection, params) {
    const Query = `insert into Twinkle(memberIdx,giftLogIdx,content,receiptImgUrl)
    values (?,?,?,?);`;

    const Row = await connection.query(Query, params);
    return Row;
}

async function updateGiftLogProved(connection, giftLogIdx) {
    const Query = `
        update GiftLog set isProved = 'Y' where idx = ?;
    `;

    const [Row] = await connection.query(Query, giftLogIdx);
    return Row;
}

async function insertTwinkleImg(connection, params) {
    const Query = `insert into TwinkleImg(twinkleIdx,imgUrl)
    values ?;`;

    const [Row] = await connection.query(Query, [params]);
    return Row;
}

async function twinkleLikechk(connection, params) {
    const Query = `select * from TwinkleLike where twinkleIdx = ? and memberIdx = ?;`;

    const [Row] = await connection.query(Query, params);
    return Row;
}

async function updateTwinkleLike(connection, params) {
    const Query = `
    update TwinkleLike set status = ? where twinkleIdx = ? and memberIdx = ?;
    `;

    const [Row] = await connection.query(Query, params);
    return Row;
}

async function insertTwinkleLike(connection, params) {
    const Query = `
    insert into TwinkleLike(twinkleIdx,memberIdx) values (?,?);
    `;

    const [Row] = await connection.query(Query, params);
    return Row;
}

async function deltwinkle(connection, ID) {
    const Query = `
        update Twinkle set status = 'INACTIVE' where idx = ?;
    `;

    const [Row] = await connection.query(Query, ID);
    return Row;
}

async function updateContentTwinkle(connection, params) {
    const Query = `
        update Twinkle set content = ? where idx = ?;
    `;

    const [Row] = await connection.query(Query, params);
    return Row;
}

async function updateTwinkle(connection, params) {
    const Query = `
        update Twinkle set content = ?, receiptImgUrl = ?
        where idx = ?;
    `;

    const [Row] = await connection.query(Query, params);
    return Row;
}

async function twinkleImgChk(connection, ID) {
    const Query = `
        select * from TwinkleImg where twinkleIdx = ?; 
    `;

    const [Row] = await connection.query(Query, ID);
    return Row;
}

async function updateTwinkleImg(connection, pa) {
    const Query = `
        update TwinkleImg set imgUrl = ?, status = 'ACTIVE' where idx = ?;
    `;

    const [Row] = await connection.query(Query, pa)

    return Row;
}

async function delTwinkleImg(connection, ID) {
    const Query = `
        update TwinkleImg set status = 'INACTIVE' where idx = ?;
    `;

    const [Row] = await connection.query(Query, ID);
    return Row;
}

async function insertComment(connection, parmas) {
    const Query = `
        insert into Comment (twinkleIdx, memberIdx,content) values (?,?,?);
    `;

    const [Row] = await connection.query(Query, parmas);
    return Row;
}

async function commentchk(connection, id) {
    const Query = `
        select * from Comment where idx = ?;
    `;

    const [Row] = await connection.query(Query, id);
    return Row;
}

async function deleteComment(connection, id) {
    const Query = `
        UPDATE Comment set status = 'C' where idx = ?;
    `;

    const [Row] = await connection.query(Query, id);
    return Row;
}

module.exports = {
    selectID,
    selectTwinkleProveList,
    selectTwinkleList,
    twinklechk,
    selectTwinklebyID,
    selectTwinklebyLogID,
    insertTwinkle,
    updateGiftLogProved,
    insertTwinkleImg,
    twinkleLikechk,
    updateTwinkleLike,
    insertTwinkleLike,
    deltwinkle,
    updateContentTwinkle,
    updateTwinkle,
    twinkleImgChk,
    updateTwinkleImg,
    delTwinkleImg,
    insertComment,
    commentchk,
    deleteComment,
    selectGiftLogID,

    
};
