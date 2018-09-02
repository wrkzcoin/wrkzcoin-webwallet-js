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
define(["require", "exports", "./Wallet", "./CoinUri", "./Storage"], function (require, exports, Wallet_1, CoinUri_1, Storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WalletRepository = /** @class */ (function () {
        function WalletRepository() {
        }
        WalletRepository.hasOneStored = function () {
            return Storage_1.Storage.getItem('wallet', null).then(function (wallet) {
                return wallet !== null;
            });
        };
        WalletRepository.getWithPassword = function (rawWallet, password) {
            if (password.length > 32)
                password = password.substr(0, 32);
            if (password.length < 32) {
                password = ('00000000000000000000000000000000' + password).slice(-32);
            }
            var privKey = new TextEncoder("utf8").encode(password);
            var nonce = new TextEncoder("utf8").encode(rawWallet.nonce);
            // rawWallet.encryptedKeys = this.b64DecodeUnicode(rawWallet.encryptedKeys);
            var encrypted = new Uint8Array(rawWallet.encryptedKeys);
            var decrypted = nacl.secretbox.open(encrypted, nonce, privKey);
            if (decrypted === null)
                return null;
            rawWallet.encryptedKeys = new TextDecoder("utf8").decode(decrypted);
            return Wallet_1.Wallet.loadFromRaw(rawWallet);
        };
        WalletRepository.getLocalWalletWithPassword = function (password) {
            var _this = this;
            return Storage_1.Storage.getItem('wallet', null).then(function (existingWallet) {
                console.log(existingWallet);
                if (existingWallet !== null) {
                    console.log(JSON.parse(existingWallet));
                    var wallet = _this.getWithPassword(JSON.parse(existingWallet), password);
                    console.log(wallet);
                    return wallet;
                }
                else {
                    return null;
                }
            });
        };
        WalletRepository.save = function (wallet, password) {
            var rawWallet = this.getEncrypted(wallet, password);
            return Storage_1.Storage.setItem('wallet', JSON.stringify(rawWallet));
        };
        WalletRepository.getEncrypted = function (wallet, password) {
            if (password.length > 32)
                password = password.substr(0, 32);
            if (password.length < 32) {
                password = ('00000000000000000000000000000000' + password).slice(-32);
            }
            var privKey = new TextEncoder("utf8").encode(password);
            var rawNonce = nacl.util.encodeBase64(nacl.randomBytes(16));
            var nonce = new TextEncoder("utf8").encode(rawNonce);
            var rawWallet = wallet.exportToRaw();
            var uint8EncryptedKeys = new TextEncoder("utf8").encode(rawWallet.encryptedKeys);
            var encrypted = nacl.secretbox(uint8EncryptedKeys, nonce, privKey);
            rawWallet.encryptedKeys = encrypted.buffer;
            var tabEncrypted = [];
            for (var i = 0; i < encrypted.length; ++i) {
                tabEncrypted.push(encrypted[i]);
            }
            rawWallet.encryptedKeys = tabEncrypted;
            rawWallet.nonce = rawNonce;
            return rawWallet;
        };
        WalletRepository.deleteLocalCopy = function () {
            return Storage_1.Storage.remove('wallet');
        };
        WalletRepository.downloadEncryptedPdf = function (wallet) {
            if (wallet.keys.priv.spend === '')
                throw 'missing_spend';
            var coinWalletUri = CoinUri_1.CoinUri.encodeWalletKeys(wallet.getPublicAddress(), wallet.keys.priv.spend, wallet.keys.priv.view, wallet.creationHeight);
            var publicQrCode = kjua({
                render: 'canvas',
                text: wallet.getPublicAddress(),
                size: 300,
            });
            var privateSpendQrCode = kjua({
                render: 'canvas',
                text: coinWalletUri,
                size: 300,
            });
            var doc = new jsPDF('landscape');
            //creating background
            doc.setFillColor(35, 31, 39);
            doc.rect(0, 0, 297, 210, 'F');
            //white blocks
            doc.setFillColor(255, 255, 255);
            doc.rect(108, 10, 80, 80, 'F');
            doc.rect(10, 115, 80, 80, 'F');
            //green blocks
            doc.setFillColor(76, 184, 96);
            doc.rect(108, 115, 80, 80, 'F');
            //green background for texts
            doc.setFillColor(76, 184, 96);
            doc.rect(108, 15, 80, 20, 'F');
            doc.rect(10, 120, 80, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(30);
            doc.text(15, 135, "Public address");
            doc.text(123, 30, "Private key");
            //lines
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(1);
            doc.line(99, 0, 99, 210);
            doc.line(198, 0, 198, 210);
            doc.line(0, 105, 297, 105);
            //adding qr codes
            doc.addImage(publicQrCode.toDataURL(), 'JPEG', 28, 145, 45, 45);
            doc.addImage(privateSpendQrCode.toDataURL(), 'JPEG', 126, 40, 45, 45);
            //wallet help
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text(110, 120, "To deposit funds to this paper wallet, send ");
            doc.text(110, 125, "Masari to the public address");
            doc.text(110, 135, "DO NOT REVEAL THE PRIVATE KEY");
            //adding masari logo
            var c = document.getElementById('canvasExport');
            if (c !== null) {
                var ctx = c.getContext("2d");
                var img = document.getElementById("verticalMasariLogo");
                if (ctx !== null && img !== null) {
                    c.width = img.width;
                    c.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    var ratio = img.width / 45;
                    var smallHeight = img.height / ratio;
                    doc.addImage(c.toDataURL(), 'JPEG', 224, 106 + (100 - smallHeight) / 2, 45, smallHeight);
                }
            }
            try {
                doc.save('keys.pdf');
            }
            catch (e) {
                alert('Error ' + e);
            }
        };
        return WalletRepository;
    }());
    exports.WalletRepository = WalletRepository;
});
