let global : any = typeof window !== 'undefined' ? window : self;
global.config = {
    //apiUrl: typeof window !== 'undefined' && window.location ? window.location.href.substr(0, window.location.href.lastIndexOf('/') + 1) + 'api/' : 'https://wallet.plenteum.com/api/',
    apiUrl: 'https://wrkz.bot.tips/', //temporary testing front end
    mainnetExplorerUrl: "https://myexplorer.wrkz.work",
    coinUnitPlaces: 2,
    coinDisplayUnitPlaces: 2,
    txMinConfirms: 20,         
    txCoinbaseMinConfirms: 20, 
    addressPrefix: 999730,
    integratedAddressPrefix: 999730,
    feePerKB: new JSBigInt('2000'), 
    dustThreshold: new JSBigInt('0'),//used for choosing outputs/change - we decompose all the way down if the receiver wants now regardless of threshold
    defaultMixin: 1, // default value mixins
    idleTimeout: 60,
    idleWarningDuration: 40,
    coinSymbol: 'WRKZ',
    coinName: 'WrkzCoin',
    coinUriPrefix: 'wrkzcoin:',
    avgBlockTime: 60,
    maxBlockNumber: 500000000,
    donateAddressWrkz: 'WrkzRNDQDwFCBynKPc459v3LDa1gEGzG3j962tMUBko1fw9xgdaS9mNiGMgA9s1q7hS1Z8SGRVWzcGc8Sh8xsvfZ6u2wJEtoZB',
};