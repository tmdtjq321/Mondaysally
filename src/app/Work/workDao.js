async function selectID(connection, memberID) {
    const Query = `
        select Member.idx, Member.status, Member.accumulatedClover,Member.firebaseToken,
               Member.isAos, Member.currentClover, Company.name,Company.status as companyStatus from Member
        join Company on Company.idx = Member.companyIdx where Member.idx = ?;
    `;
    const [resultRow] = await connection.query(Query, memberID);

    return resultRow;
}

async function insertWork(connection, idx) {
    const Query = `
        insert Work(memberIdx,workOn) values (?,now());
    `;
    const upQuery = `
        update Member set status = 'W' where idx = ?;
    `;

    const [resultRow] = await connection.query(Query, idx);
    if (idx) {
        const Row = await connection.query(upQuery, idx);
    }

    return resultRow;
}

async function todayWorkOn(connection, id) {
    const Query = `
        select idx, date_format(now(),'%y.%m.%d') as date ,timestampdiff(minute,workOn,now()) as minute 
        from Work where workOff is null and MemberIdx = ? and status = 'ACTIVE';
    `;
    const Query2 = `
        update Work, Member set Work.workOff = now(), Member.status = 'L' 
        where Work.idx = ? and Member.idx = ?;
    `;

    const [Row] = await connection.query(Query, id)
    if (Row.length !== 0) {
        const params = [Row[0].idx, id];
        const [Row2] = await connection.query(Query2, params);
    }

    return Row;
}

async function CloverWork(connection, idx, workIdx,
                          companyIdx, clover, currentClover, accumulatedClover) {
    const Query = `
    insert into Clover(memberIdx,workIdx,clover,companyIdx) values (?,?,?,?);
    `;

    const Query2 = `update Member set currentClover = ?, accumulatedClover = ?
    where idx = ?;`;


    const params = [idx, workIdx, clover, companyIdx];
    const param2 = [currentClover, accumulatedClover, idx];
    const [Row] = await connection.query(Query, params);
    const [Row2] = await connection.query(Query2, param2);
    return Row;
}

async function CloverWorkOff(connection) {
    const Query = `
        select Member.firebaseToken, Member.isAos, Company.name
        from Work join Member on Member.idx = Work.memberIdx
        join Company on Member.companyIdx = Company.idx where Work.workOff is null and Work.status = 'ACTIVE';
    `;
    const updateQuery = `update Work join Member on Member.idx = Work.memberIdx
    set Work.workOff = now(), Member.status = 'L' where Work.workOff is null;`;

    const [Row] = await connection.query(Query);
    const [Row2] = await connection.query(updateQuery);
    return Row;
}

module.exports = {
    selectID,
    insertWork,
    todayWorkOn,
    CloverWork,
    CloverWorkOff,
};
