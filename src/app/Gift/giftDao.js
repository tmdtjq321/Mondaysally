async function selectID(connection, memberID) {
    const Query = `
        select Member.idx, Member.status, Member.currentClover, Company.status as companyStatus from Member 
            join Company on Company.idx = Member.companyIdx where Member.idx = ?;
    `;
    const [resultRow] = await connection.query(Query, memberID);

    return resultRow;
}

async function selectGiftlist(connection, companyIdx, page) {
    const Query = `
        select idx, imgUrl, name from Gift 
        where status = 'ACTIVE' and companyIdx = ?;
    `;
    const [Row] = await connection.query(Query, companyIdx);
    var obj = {};
    obj.totalCount = Row.length;
    obj.gifts = [];
    let start = (page - 1) * 20;
    for (let i = start, m = 0; i < start + 20; i++, m++) {
        if (m == 20 || i >= Row.length) {
            break;
        }
        obj.gifts.push(Row[i]);
    }

    return obj;
}

async function selectGiftbyID(connection, giftID) {
    const Query = `select Gift.imgUrl,Gift.name,Gift.info,Gift.rule,Gift.createdAt,
                   GiftOption.usedClover,GiftOption.money from Gift
                   left join GiftOption on Gift.idx = GiftOption.giftIdx and
                   GiftOption.status = 'ACTIVE'
                   where Gift.idx = ? and Gift.status = 'ACTIVE';`;

    const [Row] = await connection.query(Query, giftID);
    var obj = {};
    if (Row.length == 0) {
        return null;
    }

    obj.thumnail = Row[0].imgUrl;
    obj.name = Row[0].name;
    obj.info = Row[0].info;
    obj.rule = Row[0].rule;
    obj.options = [];
    for (let i in Row) {
        if (Row[i].usedClover && Row[i].money) {
            obj.options.push({ 'usedClover': Row[i].usedClover, 'money': Row[i].money });
        }
    }
    return obj;
}

async function selectGiftLoglists(connection, memberID, page) {
    const Query = `
        select GiftLog.idx as giftLogIdx, Gift.imgUrl, GiftLog.isAccepted, GiftLog.isProved, Twinkle.idx as twinkleIdx,
               Gift.name, GiftLog.usedClover from GiftLog
               join Gift on GiftLog.giftIdx = Gift.idx
            left join Twinkle on Twinkle.giftLogIdx = GiftLog.idx
        where GiftLog.memberIdx = ? and GiftLog.status = 'ACTIVE'
        order by GiftLog.createdAt desc;
    `;

    const [Row] = await connection.query(Query, memberID);
    var obj = {};
    obj.totalCount = Row.length;
    obj.giftLogs = [];
    let start = (page - 1) * 20;
    for (let i = start, m = 0; i < start + 20; i++, m++) {
        if (m == 20 || i >= Row.length) {
            break;
        }
        obj.giftLogs.push(Row[i]);
    }

    return obj;
}

async function Giftchk(connection, id) {
    const Query = `
        select * from Gift where idx = ? and status = 'ACTIVE';
    `;

    const [Row] = await connection.query(Query, id)

    return Row;
}

async function GiftLogCount(connection, memberID) {
    const Query = `select sum(usedClover) as totalClover from GiftLog
                   where memberIdx = ? and isAccepted is null and status = 'ACTIVE';`;

    const [Row] = await connection.query(Query, memberID);
    return Row;
}

async function insertGiftApply(connection, params) {
    const Query = `
    insert into GiftLog(giftIdx, usedClover, memberIdx)
    values (?,?,?);
    `;

    const [Row] = await connection.query(Query, params);
    return Row;
}

module.exports = {
    selectID,
    selectGiftlist,
    selectGiftbyID,
    selectGiftLoglists,
    Giftchk,
    GiftLogCount,
    insertGiftApply,


};
