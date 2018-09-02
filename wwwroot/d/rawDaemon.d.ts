type vi = {
    a: number,
    ki: string,
    ko: number[],
    mx: number
    on: number,
    oh: string,
    t: string
}

type vo = {
    gI: number,
    a: 0,
    k: string,
    t: string
}

type RawDaemonTransaction = {
    vo: vo[],
    vi: vi[],
    f: number, //fee
    uT: number, //unlockTime
    gI?: number, //global_index_start
    h?: number, //height
    ts?: number, //timestamp
    hs?: string, //hash
    pk: string, //publicKey
    pId: string //paymentId
};

type RawDaemonBlock = any;