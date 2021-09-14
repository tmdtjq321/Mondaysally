async function selectID(connection, memberID) {
    const Query = `
        select Member.idx, Member.status, Member.accumulatedClover,Member.currentClover, Company.status as companyStatus from Member
        join Company on Company.idx = Member.companyIdx where Member.idx = ?;
    `;
    const [resultRow] = await connection.query(Query, memberID);

    return resultRow;
}

async function accumulateCloverList(connection, params) {
    const Query = `
        select Clover.idx, date_format(Clover.createdAt,'%y.%m.%d') as time, 
            TIMESTAMPDIFF(hour, Work.workOn, Work.workOff) AS worktime, TRUNCATE(Clover.clover,0) as clover from Clover
            join Work on Work.idx = Clover.workIdx
        where Clover.memberIdx = ? and Clover.status = 'ACTIVE' and Clover.workIdx is not null
        order by Clover.createdAt desc limit ?, 20;
    `;

    const [Row] = await connection.query(Query, params);
    return Row;
}

async function usedCloverList(connection, params) {
    const Query = `select Clover.idx, date_format(Clover.createdAt,'%y.%m.%d') as time,
        Gift.name, TRUNCATE(Clover.clover,0) as clover from Clover
        join Gift on Clover.giftIdx = Gift.idx
        where Clover.memberIdx = ? and Clover.status = 'ACTIVE' and Clover.workIdx is null
        order by Clover.createdAt desc limit ?, 20;
    `;

    const [Row] = await connection.query(Query, params);
    return Row;
}

async function selectCanUseClover(connection, params) {
    const Query = `
        select Gift.idx, Gift.imgUrl, Gift.name from GiftOption
        join Gift on Gift.idx = GiftOption.giftIdx and Gift.status = 'ACTIVE'
        where GiftOption.usedClover <= ? and Gift.companyIdx = ? 
        group by Gift.idx limit ?, 20;
    `;

    const [Row] = await connection.query(Query, params);
    return Row;
}

async function selectCloverRank(connection, page, companyIdx) {
    const Query = `
        select rank() over (order by currentClover desc) as ranking,
               imgUrl, nickname, currentClover
        from Member
        where (Member.status = 'W' or Member.status = 'L') and companyIdx = ?
        group by Member.idx limit ?, 20;
    `;

    const params = [companyIdx,(page - 1) * 20];
    const [Row] = await connection.query(Query, params);
    return Row;
}

module.exports = {
    selectID,
    accumulateCloverList,
    usedCloverList,
    selectCanUseClover,
    selectCloverRank,
    
};
