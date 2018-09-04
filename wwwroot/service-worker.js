"use strict";
/*
 * Copyright (c) 2018, Gnock
 * Copyright (c) 2018, The Masari Project
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js');
workbox.precaching.precacheAndRoute([
  {
    "url": "api.html",
    "revision": "e6a6108e7d899cb1257a5dcc031b59b6"
  },
  {
    "url": "api.js",
    "revision": "c875535b401e2ae6282e5b9b6b7b5905"
  },
  {
    "url": "assets/css/font-awesome.css",
    "revision": "4bb3dd721c4652feee0953261d329710"
  },
  {
    "url": "assets/css/font-awesome.min.css",
    "revision": "a0e784c4ca94c271b0338dfb02055be6"
  },
  {
    "url": "assets/css/main.css",
    "revision": "0130ac7a79dbe934f47029e71e08e749"
  },
  {
    "url": "assets/img/binary-background.jpg",
    "revision": "9950b9f8a4133456595e5e9a2bc3f7e8"
  },
  {
    "url": "assets/img/favicon.ico",
    "revision": "2f6d855fc0aac990a5f49b59d2fd2be8"
  },
  {
    "url": "assets/img/icons/icon-128x128.png",
    "revision": "e811e677a13d26ebef437640e1bb7d30"
  },
  {
    "url": "assets/img/icons/icon-144x144.png",
    "revision": "acc05fbd2d5578b078dded25d19e731d"
  },
  {
    "url": "assets/img/icons/icon-152x152.png",
    "revision": "a4f5659dda1cfe7aba3fb84104a563c5"
  },
  {
    "url": "assets/img/icons/icon-192x192.png",
    "revision": "78dfb4755afb8642a9c43147ccb1cd08"
  },
  {
    "url": "assets/img/icons/icon-256x256.png",
    "revision": "ae887fc3850ec2b3cdb71d5a97b318be"
  },
  {
    "url": "assets/img/icons/icon-402x402.png",
    "revision": "3f37d9ffeb2d1e492a6b6d6d9e90d5bc"
  },
  {
    "url": "assets/img/landing/75-usersthink-stock-image.jpg",
    "revision": "7a00bbf57aacc5303e846055b6dae1cb"
  },
  {
    "url": "assets/img/logo_white.png",
    "revision": "021a9a3c4434d955aa6430d6f32d24f6"
  },
  {
    "url": "assets/img/logo.png",
    "revision": "0daf6c33a5e5b443af277c7082717cdd"
  },
  {
    "url": "assets/img/logoQrCode.jpg",
    "revision": "06e867b1281284af0732ba9ef0e11d6d"
  },
  {
    "url": "assets/img/logoQrCode.png",
    "revision": "db552925892bbba67897385ea2c91b39"
  },
  {
    "url": "assets/img/Masari_Vertical.png",
    "revision": "6f0560be9757e26945f1eb232474bc22"
  },
  {
    "url": "config.js",
    "revision": "b97c5ada081cb2d36aaea5aa63650f39"
  },
  {
    "url": "d/vue-i118n.js",
    "revision": "85fd5089c3278f8f544a3691fd38f49b"
  },
  {
    "url": "filters/Filters.js",
    "revision": "29bc37b0c2163260e18f6d6ea09fb0e0"
  },
  {
    "url": "index.html",
    "revision": "62301ac3545721386eba7f324fec8e98"
  },
  {
    "url": "index.js",
    "revision": "8010108d97f29924a4d57a226f439226"
  },
  {
    "url": "lib/base58.js",
    "revision": "cad61541b48010d7e792f394567995a7"
  },
  {
    "url": "lib/biginteger.js",
    "revision": "530a07476fdc1ca4e90f0696dde85709"
  },
  {
    "url": "lib/cn_utils - Copy.js",
    "revision": "a7ed4f18b6258fa0df4fe65e54eb1532"
  },
  {
    "url": "lib/cn_utils_native.js",
    "revision": "6f382226c0962599661c49e5b5952d77"
  },
  {
    "url": "lib/cn_utils_temp.js",
    "revision": "b2b7b9ddbb12d1c195804117412d5767"
  },
  {
    "url": "lib/cn_utils.js",
    "revision": "a7ed4f18b6258fa0df4fe65e54eb1532"
  },
  {
    "url": "lib/crypto.js",
    "revision": "94a47d1cad1e87e779eb29e21225f1e4"
  },
  {
    "url": "lib/decoder.min.js",
    "revision": "87eac23b87a1b14b80563b5fe775bc17"
  },
  {
    "url": "lib/FileSaver.min.js",
    "revision": "d2e0d52146931b50ded6b4a8cadb6f8f"
  },
  {
    "url": "lib/idb-keyval.js",
    "revision": "ef08c7c08df18624887de5e53206726b"
  },
  {
    "url": "lib/jquery-3.2.1.min.js",
    "revision": "473957cfb255a781b42cb2af51d54a3b"
  },
  {
    "url": "lib/jspdf.min.js",
    "revision": "bcc6f9c8d3b58438d8e8aa24314b41f9"
  },
  {
    "url": "lib/kjua-0.1.1.min.js",
    "revision": "f0ea94e8c4cbc705eaaf8b6cede15389"
  },
  {
    "url": "lib/mining/cn.js",
    "revision": "61bb278f05944f130d36441262aafe65"
  },
  {
    "url": "lib/mining/cn2.js",
    "revision": "bc3b8fa73d894d3ddffa1d2e7bb0bb0f"
  },
  {
    "url": "lib/mining/worker.js",
    "revision": "4a041fb8ca2e19716f03de4e276a7f0e"
  },
  {
    "url": "lib/mnemonic.js",
    "revision": "f81f584bb025513e9544900b0e9d0c31"
  },
  {
    "url": "lib/nacl-fast-cn.js",
    "revision": "5a4c4d33ad852ae5cce33dcc2c3d29a3"
  },
  {
    "url": "lib/nacl-fast.js",
    "revision": "7458a6b3018e57a4ab4ca81a6dd26dd2"
  },
  {
    "url": "lib/nacl-fast.min.js",
    "revision": "4e5450d2e030eed0c1b96cccd68ab8db"
  },
  {
    "url": "lib/nacl-util.min.js",
    "revision": "c7b843b9e9b5aad102c855c600c7edc8"
  },
  {
    "url": "lib/nacl.js",
    "revision": "43f0590d1bd0d155c37168eef6375e14"
  },
  {
    "url": "lib/nacl.min.js",
    "revision": "d8eaf281c8890a60ebe82840456edc33"
  },
  {
    "url": "lib/numbersLab/Context.js",
    "revision": "ebb2aae3a749741226613dd291cc2839"
  },
  {
    "url": "lib/numbersLab/DependencyInjector.js",
    "revision": "56b74e4cb0875af2c45a175cdf436ebd"
  },
  {
    "url": "lib/numbersLab/DestructableView.js",
    "revision": "130f58a50d4641ce84928ccbacf1a965"
  },
  {
    "url": "lib/numbersLab/Logger.js",
    "revision": "de9da3f513d18d131cbe7fd783105cd5"
  },
  {
    "url": "lib/numbersLab/Observable.js",
    "revision": "d3bede42dfc41a78b4d50647bdb74646"
  },
  {
    "url": "lib/numbersLab/Router.js",
    "revision": "35a09adb39f912c4ec5aa285c37cca80"
  },
  {
    "url": "lib/numbersLab/VueAnnotate.js",
    "revision": "503a173798ba5bfb0598061b62864920"
  },
  {
    "url": "lib/require.js",
    "revision": "5b08692433e727db32f63db348f4837b"
  },
  {
    "url": "lib/sha3.js",
    "revision": "c38274b1eab5b932269f17bb9cc759b0"
  },
  {
    "url": "lib/sweetalert2.js",
    "revision": "59eb5df1a27b4ba7d10b4ce3e3749f30"
  },
  {
    "url": "lib/vue-i18n.js",
    "revision": "fe8f6691b4ed710c1cb85182ab223a3f"
  },
  {
    "url": "lib/vue.min.js",
    "revision": "3e7fd9458a2147045ce499aa4ccc27f6"
  },
  {
    "url": "manifest.json",
    "revision": "853e269ae97fc7e8e45ea338007b7099"
  },
  {
    "url": "model/AppState.js",
    "revision": "8bd308a3c89aaea6936e7660e9601aa1"
  },
  {
    "url": "model/blockchain/BlockchainExplorer.js",
    "revision": "d6d40c2136d1a323875a08cd9fdf5bd5"
  },
  {
    "url": "model/blockchain/BlockchainExplorerRpc2.js",
    "revision": "5ec1e765eadd462b8a1dbcb153cc4be2"
  },
  {
    "url": "model/CnUtilNative.js",
    "revision": "3f9e20f402466aac3afb6b40454d858e"
  },
  {
    "url": "model/CoinUri.js",
    "revision": "42d1130af973c7b26acbb637bd9f4cf1"
  },
  {
    "url": "model/Constants.js",
    "revision": "cdd693e72400596bd0bf8999b9ec9f46"
  },
  {
    "url": "model/CryptoUtils.js",
    "revision": "909e7fab9ea2e726df901e41f249c53f"
  },
  {
    "url": "model/KeysRepository.js",
    "revision": "6cae163c5d446776dab6eda9e9cb8d3b"
  },
  {
    "url": "model/MathUtil.js",
    "revision": "abb139f8ad4a6d8d79499d34207a82fa"
  },
  {
    "url": "model/Mnemonic.js",
    "revision": "3c12ff228c1de3718c991a2015c7008e"
  },
  {
    "url": "model/MnemonicLang.js",
    "revision": "25d0d56d4c41c4faeadcad7ad011be9e"
  },
  {
    "url": "model/Nfc.js",
    "revision": "7e399a97da4ef764b528401d84951474"
  },
  {
    "url": "model/Password.js",
    "revision": "cf55f6790d20972b5932bfe2f49e1790"
  },
  {
    "url": "model/QRReader.js",
    "revision": "4f2000ccdffec3450c3564b7ccad1997"
  },
  {
    "url": "model/Storage.js",
    "revision": "fa20066a58f4e2ee45879cc515030889"
  },
  {
    "url": "model/Transaction.js",
    "revision": "8e2ec085acca5e1312ab6e6409b6c85b"
  },
  {
    "url": "model/TransactionsExplorer.js",
    "revision": "1c8bcef0a478020b91b1d544d392c951"
  },
  {
    "url": "model/Translations.js",
    "revision": "ab370d008a22c7f15e05ff7a80776746"
  },
  {
    "url": "model/Wallet.js",
    "revision": "75eb104aa5d8c0b8568a52b93aa6b205"
  },
  {
    "url": "model/WalletRepository.js",
    "revision": "6a934081f4d20fa7ffe1466259b2434b"
  },
  {
    "url": "pages/account.html",
    "revision": "ce9f1016c9f135c0325c5489843003ea"
  },
  {
    "url": "pages/account.js",
    "revision": "720f44ca49dd0d3741ccb7c9fcd02e11"
  },
  {
    "url": "pages/changeWalletPassword.html",
    "revision": "6961bb048cd0617399ee0d7b186bf3b1"
  },
  {
    "url": "pages/changeWalletPassword.js",
    "revision": "7325e72163f7854604dc43f88f7d8fe3"
  },
  {
    "url": "pages/createWallet.html",
    "revision": "49a66942d232a9ecb5c0e0d5bff9e433"
  },
  {
    "url": "pages/createWallet.js",
    "revision": "7d1dd645f8194ca17ba19817940f717b"
  },
  {
    "url": "pages/disconnect.html",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  },
  {
    "url": "pages/disconnect.js",
    "revision": "a2771001f905e32049f0301329387401"
  },
  {
    "url": "pages/donate.html",
    "revision": "34c9e9109cdb31da807be36fe04fc15f"
  },
  {
    "url": "pages/donate.js",
    "revision": "17f263a9cde6cfafadfdb7eb4f3737a3"
  },
  {
    "url": "pages/export.html",
    "revision": "cb1ea51672b0428bc9526a61773d777b"
  },
  {
    "url": "pages/export.js",
    "revision": "b2cc9fc557535038e0aec95d353deb45"
  },
  {
    "url": "pages/import.html",
    "revision": "399e9714c496ee92076c8055f470d816"
  },
  {
    "url": "pages/import.js",
    "revision": "44ea2b901c09a46d4cd5a95e2370ae40"
  },
  {
    "url": "pages/importFromFile.html",
    "revision": "e78206b3a5d2f17cbaf857126778545d"
  },
  {
    "url": "pages/importFromFile.js",
    "revision": "3f11ccbcc131e483b7dc50e703202f23"
  },
  {
    "url": "pages/importFromKeys.html",
    "revision": "9eeaa15d98e7871992ca14d5e14dd0b1"
  },
  {
    "url": "pages/importFromKeys.js",
    "revision": "90071f4e7d084106355689e500d0d516"
  },
  {
    "url": "pages/importFromMnemonic.html",
    "revision": "9dd02c89b9dd07c3b0e69a18df1b8236"
  },
  {
    "url": "pages/importFromMnemonic.js",
    "revision": "008c9a1345a5bc538939f6d126a82c84"
  },
  {
    "url": "pages/importFromQr.html",
    "revision": "d066f402ce1243383d024820920704b0"
  },
  {
    "url": "pages/importFromQr.js",
    "revision": "17e06406597ffd2ded4d394031df079d"
  },
  {
    "url": "pages/index.html",
    "revision": "99d6ec6a6e6d273aba3dee806c2c8bca"
  },
  {
    "url": "pages/index.js",
    "revision": "8fa1c7bd3bd39ca9c42441fa6af2818f"
  },
  {
    "url": "pages/mining.html",
    "revision": "36b62bc413f550c0d85e4087b0dd76b1"
  },
  {
    "url": "pages/mining.js",
    "revision": "8cef2cc01c60fd8e34fd402d2cc3096d"
  },
  {
    "url": "pages/network.html",
    "revision": "2a5125f94ca21cd4fc930efc555daa25"
  },
  {
    "url": "pages/network.js",
    "revision": "2c499bdba026d12a15f99f32f18e2f89"
  },
  {
    "url": "pages/receive.html",
    "revision": "f2f69df6e47d5e4c20fd20cd053e3e44"
  },
  {
    "url": "pages/receive.js",
    "revision": "6a01faf98d02b2af2e8a552ce8e6d3d0"
  },
  {
    "url": "pages/send.html",
    "revision": "4153533a50229964530c77012dbb122a"
  },
  {
    "url": "pages/send.js",
    "revision": "e03fd2ab4beae4a273d1ff10c9824e29"
  },
  {
    "url": "pages/settings.html",
    "revision": "25e554d8d1d854700a70cc10d789bab6"
  },
  {
    "url": "pages/settings.js",
    "revision": "8e2132607f62e1f5e86f3adb2bdf3bdf"
  },
  {
    "url": "pages/support.html",
    "revision": "31713e30917936b7b04c06f4e2c920b4"
  },
  {
    "url": "pages/support.js",
    "revision": "f8135fd2b9c7f8744750ae6520c0fabf"
  },
  {
    "url": "pages/termsOfUse.html",
    "revision": "402b22c82097e427744a7e3d318a8b0c"
  },
  {
    "url": "pages/termsOfUse.js",
    "revision": "db3af3ca3c81ead32a62ac01c84a1608"
  },
  {
    "url": "providers/BlockchainExplorerProvider.js",
    "revision": "c4bc6752d3d53afe07d6d5693759884b"
  },
  {
    "url": "service-worker-raw.js",
    "revision": "47711885594600fb63e07580fa331c04"
  },
  {
    "url": "translations/de.json",
    "revision": "3afa389fa3e3ee6b324a59f9f1330858"
  },
  {
    "url": "translations/en.json",
    "revision": "5f41329dcaa28b37e15fa2de3baeccf8"
  },
  {
    "url": "translations/fr.json",
    "revision": "34f85928e18611d92c1d421954900ec8"
  },
  {
    "url": "translations/hu.json",
    "revision": "f29c7fca549edb9f5705cafafeeb468b"
  },
  {
    "url": "translations/sr.json",
    "revision": "6d63bb5bbcf06ea192b3ff142d913d03"
  },
  {
    "url": "utils/Url.js",
    "revision": "9bc2c6a7dcb4c4340e8f61f845b95e15"
  },
  {
    "url": "workers/TransferProcessing.js",
    "revision": "32f04891f874166583c15cdc4e13a3ba"
  },
  {
    "url": "workers/TransferProcessingEntrypoint.js",
    "revision": "ec2ef7dbfe74836cd5bd22eefe30ccf1"
  }
]);
self.addEventListener('message', function (event) {
    if (!event.data) {
        return;
    }
    switch (event.data) {
        case 'force-activate':
            self.skipWaiting();
            self.clients.claim();
            self.clients.matchAll().then(function (clients) {
                clients.forEach(function (client) { return client.postMessage('reload-window-update'); });
            });
            break;
        default:
            // NOOP
            break;
    }
});
