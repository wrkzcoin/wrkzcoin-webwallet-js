type vi = {
    amount: number,
    keyImage: string,
    type: string
}

type vo = {
    index: number,
    globalIndex: number,
    amount: 0,
    key: string,
    type: string
}

type RawDaemonTransaction = {
    outputs: vo[],
    inputs: vi[],
    fee: number, //fee
    unlockTime: number, //unlockTime
    height?: number, //height
    timestamp?: number, //timestamp
    hash?: string, //hash
    publicKey: string, //publicKey
    paymentId: string //paymentId
};

type RawDaemonBlock = any;