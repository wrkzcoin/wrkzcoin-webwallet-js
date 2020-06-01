/*
 * Copyright (c) 2018, Gnock
 * Copyright (c) 2018, The Masari Project
 * Copyright (c) 2018, The Plenteum Project
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

import {RawWallet, Wallet} from "./Wallet";
import {CoinUri} from "./CoinUri";
import {Storage} from "./Storage";
import { Mnemonic } from "../model/Mnemonic";

export class WalletRepository{

    static hasOneStored() : Promise<boolean>{
        return Storage.getItem('wallet', null).then(function (wallet : any) {
            return wallet !== null;
        });
    }
    
    static getWithPassword(rawWallet : RawWallet, password : string) : Wallet|null{
        if(password.length > 32)
            password = password.substr(0 , 32);
        if(password.length < 32){
            password = ('00000000000000000000000000000000'+password).slice(-32);
        }

        let privKey = new (<any>TextEncoder)("utf8").encode(password);
        let nonce = new (<any>TextEncoder)("utf8").encode(rawWallet.nonce);
        // rawWallet.encryptedKeys = this.b64DecodeUnicode(rawWallet.encryptedKeys);
        let encrypted = new Uint8Array(<any>rawWallet.encryptedKeys);
        let decrypted = nacl.secretbox.open(encrypted, nonce, privKey);
        if(decrypted === null)
            return null;
        rawWallet.encryptedKeys = new TextDecoder("utf8").decode(decrypted);
        return Wallet.loadFromRaw(rawWallet);
    }

    static getLocalWalletWithPassword(password : string) : Promise<Wallet|null>{
        return Storage.getItem('wallet', null).then((existingWallet : any) => {
            //console.log(existingWallet);
            if(existingWallet !== null){
                //console.log(JSON.parse(existingWallet));
                let wallet : Wallet|null = this.getWithPassword(JSON.parse(existingWallet), password);
                //console.log(wallet);
                return wallet;
            }else{
                return null;
            }
        });
    }
    
    static save(wallet : Wallet, password : string) : Promise<void>{
        let rawWallet = this.getEncrypted(wallet, password);
        return Storage.setItem('wallet', JSON.stringify(rawWallet));
    }

    static getEncrypted(wallet : Wallet, password : string){
        if(password.length > 32)
            password = password.substr(0 , 32);
        if(password.length < 32){
            password = ('00000000000000000000000000000000'+password).slice(-32);
        }

        let privKey = new (<any>TextEncoder)("utf8").encode(password);
        let rawNonce = nacl.util.encodeBase64(nacl.randomBytes(16));
        let nonce = new (<any>TextEncoder)("utf8").encode(rawNonce);
        let rawWallet = wallet.exportToRaw();
        let uint8EncryptedKeys = new (<any>TextEncoder)("utf8").encode(rawWallet.encryptedKeys);

        let encrypted : Uint8Array = nacl.secretbox(uint8EncryptedKeys, nonce, privKey);
        rawWallet.encryptedKeys = <any>encrypted.buffer;
        let tabEncrypted = [];
        for(let i = 0; i < encrypted.length; ++i){
            tabEncrypted.push(encrypted[i]);
        }
        rawWallet.encryptedKeys = <any>tabEncrypted;
        rawWallet.nonce = rawNonce;
        return rawWallet;
    }

    static deleteLocalCopy() : Promise<void>{
        return Storage.remove('wallet');
    }

    static dottedLine(doc: any, xFrom: number, yFrom: number, xTo: number, yTo: number, segmentLength: number) {
        // Calculate line length (c)
        var a = Math.abs(xTo - xFrom);
        var b = Math.abs(yTo - yFrom);
        var c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

        // Make sure we have an odd number of line segments (drawn or blank) to fit it nicely
        var fractions = c / segmentLength;
        var adjustedSegmentLength = (Math.floor(fractions) % 2 === 0) ? (c / Math.ceil(fractions)) : (c / Math.floor(fractions));

        // Calculate x, y deltas per segment
        var deltaX = adjustedSegmentLength * (a / c);
        var deltaY = adjustedSegmentLength * (b / c);

        var curX = xFrom, curY = yFrom;
        while (curX <= xTo && curY <= yTo) {
            doc.line(curX, curY, curX + deltaX, curY + deltaY);
            curX += 2 * deltaX;
            curY += 2 * deltaY;
        }
    }

    static downloadEncryptedPdf(wallet : Wallet){
        if(wallet.keys.priv.spend === '')
            throw 'missing_spend';

        let coinWalletUri = CoinUri.encodeWalletKeys(
            wallet.getPublicAddress(),
            wallet.keys.priv.spend,
            wallet.keys.priv.view,
            wallet.creationHeight
        );

        let publicQrCode = kjua({
            render: 'canvas',
            text: wallet.getPublicAddress(),
            size:300,
        });

        let privateSpendQrCode = kjua({
            render: 'canvas',
            text: wallet.keys.priv.spend,
            size: 300,
        });

        let privateViewQrCode = kjua({
            render: 'canvas',
            text: wallet.keys.priv.view,
            size: 300,
        });

        
        let logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARkAAACACAYAAAA/Dh0oAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkUyREQ0NThDOTg2RTExRTg4NUYwRDYyM0MxNjM2MkYyIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkUyREQ0NThEOTg2RTExRTg4NUYwRDYyM0MxNjM2MkYyIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6RTJERDQ1OEE5ODZFMTFFODg1RjBENjIzQzE2MzYyRjIiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RTJERDQ1OEI5ODZFMTFFODg1RjBENjIzQzE2MzYyRjIiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4u1QeXAAAdFElEQVR42uyd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";

        let doc = new jsPDF('landscape');

        // background color
        doc.setFillColor(0, 118, 168);
        doc.rect(0, 0, 297, 210, "F");

        

        // middle line
        doc.setLineWidth(0.2);
        doc.setDrawColor(255, 255, 255);
        this.dottedLine(doc, 0, 105, 297, 105, 2);
        // column lines
        doc.setDrawColor(255, 255, 255);
        this.dottedLine(doc, 99, 0, 99, 210, 2);
        this.dottedLine(doc, 198, 0, 198, 210, 2);


        // BOX 1 [x = 5, y = 10]
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(35, 190, 226);
        doc.rect(5, 5, 90, 90, "F");
        doc.setFillColor(35, 190, 226);
        doc.rect(5, 75, 90, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        doc.text('Private View', 79, 79, null, 180);
        doc.addImage(privateViewQrCode, 'PNG', 25, 20, 50, 50);
        let qrViewText = wallet.keys.priv.view;
        let qrViewSplit = Math.ceil(qrViewText.length / 2);
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.text(qrViewText.slice(0, qrViewSplit), 74, 15, null, 180);
        doc.text(qrViewText.slice(qrViewSplit), 74, 11, null, 180);


        // BOX 2 - [x = 104, y = 10]
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(35, 190, 226);
        doc.rect(104, 5, 90, 90, "F");
        doc.setFillColor(35, 190, 226);
        doc.rect(104, 75, 90, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        doc.text('Private Spend', 182.5, 79, null, 180);
        doc.addImage(privateSpendQrCode, 'PNG', 124, 20, 50, 50);
        let qrSpendText = wallet.keys.priv.spend;
        let qrSpendSplit = Math.ceil(qrSpendText.length / 2);
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.text(qrSpendText.slice(0, qrSpendSplit), 174, 15, null, 180);
        doc.text(qrSpendText.slice(qrSpendSplit), 174, 11, null, 180);


        // BOX 3 - [x = 203, y = 10]
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(35, 190, 226);
        doc.rect(203, 5, 90, 90, "F");
        doc.setFillColor(35, 190, 226);
        doc.rect(203, 75, 90, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        doc.text('Mnemonic Seed', 286, 79, null, 180);
        //todo, add mnemonic text
        doc.setFontSize(12)
        let mnemon = Mnemonic.mn_encode(wallet.keys.priv.spend, "english");
        let mnemonicWords = mnemon !== null ? mnemon.split(' ') : [];
        doc.setTextColor(0, 0, 0);
        try {
            let lineOne = mnemonicWords.splice(0, 5);
            let lineTwo = mnemonicWords.splice(0, 5);
            let lineThree = mnemonicWords.splice(0, 5);
            let lineFour = mnemonicWords.splice(0, 5);
            let lineFive = mnemonicWords.splice(0, 5);
            let startPos = 291;
            let strLineOne = lineOne.join(' ');
            let startLineOne = startPos - parseInt(Math.floor((50 - strLineOne.length) / 2).toString());
            doc.text(strLineOne, startLineOne, 63, null, 180);
            let strLineTwo = lineTwo.join(' ');
            let startLineTwo = startPos - parseInt(Math.floor((50 - strLineTwo.length) / 2).toString());
            doc.text(strLineTwo, startLineTwo, 52, null, 180);
            let strLineThree = lineThree.join(' ');
            let startLineThree = startPos - parseInt(Math.floor((50 - strLineThree.length) / 2).toString());
            doc.text(strLineThree, startLineThree, 39, null, 180);
            let strLineFour = lineFour.join(' ');
            let startLineFour = startPos - parseInt(Math.floor((50 - strLineFour.length) / 2).toString());
            doc.text(strLineFour, startLineFour, 27, null, 180);
            let strLineFive = lineFive.join(' ');
            let startLineFive = startPos - parseInt(Math.floor((50 - strLineFive.length) / 2).toString());
            doc.text(strLineFive, startLineFive, 15, null, 180);
        }
        catch (e) {
            console.log("Couldn't get Mnemonic, ignoring!");
        }
        // BOX 4 - [x = 0, y = 100]
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(35, 190, 226);
        doc.rect(5, 115, 90, 90, "F");
        doc.setFillColor(35, 190, 226);
        doc.rect(5, 120, 90, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        doc.text('Public Wallet', 20, 132, null, 0);
        doc.addImage(publicQrCode, 'PNG', 25, 140, 50, 50);
        let qrPublicText = wallet.getPublicAddress();
        let qrPublicSplit = Math.ceil(qrPublicText.length / 3);
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.text(qrPublicText.slice(0, qrPublicSplit), 23, 194, null, 0);
        doc.text(qrPublicText.slice(qrPublicSplit, qrPublicSplit * 2), 22, 198, null, 0);
        doc.text(qrPublicText.slice(qrPublicSplit * 2), 23, 202, null, 0);


        // BOX 5 - [x = 104, y = 110]
        doc.setFillColor(35, 190, 226);
        doc.roundedRect(104, 115, 89, 85, 2, 2, 'F');
        doc.setFontSize(10)
        doc.setTextColor(255, 255, 255)
        doc.text(108, 125, 'To deposit funds to this paper wallet, send the');
        doc.text(108, 130, 'WrkzCoin (WRKZ) coins to the public address.');
        doc.text(108, 150, 'DO NOT REVEAL THE PRIVATE SPEND KEY.');
        doc.text(108, 165, 'Until you are ready to import the balance from this');
        doc.text(108, 170, 'wallet to your WrkzCoin wallet, a cryptocurrency');
        doc.text(108, 175, 'client, or exchange.');
        doc.text(108, 185, 'Amount:');
        doc.setDrawColor(255, 255, 255);
        doc.line(122, 185, 150, 185);
        doc.text(155, 185, 'Date:');
        doc.line(164, 185, 182, 185);
        doc.text(108, 190, 'Notes:');
        doc.line(119, 190, 182, 190);


        // BOX 6 - [x = 203, y = 110]
        doc.addImage(logo, 'PNG', 208, 135, 80, 36.44);


        // PAGE 2
        doc.addPage();

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(26);
        doc.text('Folding instructions', 12, 20, null, 0);
        doc.setFillColor(0, 0, 0);
        doc.rect(12, 24, 273, 0.5, "F");

        // STEP 1
        doc.setTextColor(9, 27, 38);
        doc.setFontSize(14);
        doc.text('Step 1', 12, 50, null, 0);
        var step1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAI2CAIAAAAn6nsNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjZBRjRGRjlCOTg3MDExRThCMzc2REUzMjJGM0YyMDJBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjZBRjRGRjlDOTg3MDExRThCMzc2REUzMjJGM0YyMDJBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NkFGNEZGOTk5ODcwMTFFOEIzNzZERTMyMkYzRjIwMkEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NkFGNEZGOUE5ODcwMTFFOEIzNzZERTMyMkYzRjIwMkEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7V2kF4AAAhEElEQVR42uzdeXxU9b3wcQYChLAkQpBFG0RcgoIoXsRboS4VvN5aidXaFpemldaltrZq1XqV1m7SW+/Lai9a0droc4s+djFWrV5QcYl7WWQz4gKGXQJMWJKQbZ5fOX3GaYBJgAQkvN9/9DUzOXMy84UffjpnZk67dgAAAAAAAMB+JJZ6JZFImAgAwK5EVezjrGpvHJDepEmTiouLzQEiYTmERWEO0ERspV7xChZsKycnp6CgoKioyCggKCwsDI0Vj8eNAhpHlVewAABaj8ACABBYAAACCwBgv5JhBJDe5ZdfPnToUHOAyNixY/v162cOkJ5PEQIAtERU+RQhAEDrEVgAAAILAEBgAQAILAAABBYAgMACABBYAAAILAAAgQUAILCg7Zs6dWpJSYk5QCQsh7AozAHScy5CaEJOTk5BQUFRUZFRQFBYWFhcXByPx40CGkeVcxECALQegQUAILAAAAQWAIDAAgBAYAEACCwAAIEFAIDAAgAQWAAAAgvavqFDh+bl5ZkDRMJyCIvCHCA95yIEAGiJqHIuQgCA1iOwAAAEFgCAwAIAEFgAAAgsAACBBQAgsAAAEFgAAAILAEBgQdsXr6iorKwyB4iE5RAWhTmAwILdcsiAAVdccbk5QCQsh7AozAEEFgCAwAIAEFgAAAgsAACBBQAgsAAABBYAAAILAEBgAQAILAAABBYAwF4VS72SSCRMBBopKyvLyuqam9vLKCAoL19bWbk5Ly/PKKBxVMViAgsAoLUCyyFCAIAWJrAAAAQWAIDAAgAQWAAACCwAAIEFACCwAAAQWAAAAgsAQGBB23fWWWdNmjTJHCASlkNYFOYA6WUYAaRXUlKSm5trDhApLS0Ni8IcID2vYAEACCwAAIEFACCwAAAQWAAAAgsAQGABACCwAAAEFgCAwAIAoDGnyoEm3HrrrYMGDTIHiIwfP37kyJHmAOnFUq8kEgkTAQDYlaiKfZxVDhECALQwgQUAILAAAAQWAIDAAgBAYAEACCwAAIEFAIDAAgAQWAAAAgvavrvvvnvatGnmAJGwHMKiMAdIz7kIoQk5OTkFBQVFRUVGAUFhYWFxcXE8HjcKaBxVzkUIANB6BBYAgMACABBYAAACCwAAgQUAILAAANqqjH39CZx11uc3bNgQXf7Vr24fPnx4dLmmpuaiiy5euXJluNy/f/8HH3ygU6dO0Y9effXV66+/Ibrct2/f8KPMzMxGu62urn7sscf+/OdH586du3bt2g4dOoQtTzjhhC996fzTTjtt24dRUVExfvwFGzdubM5jnjDhkosvvnjb2xOJxDe+8c1FixZFV0899dRbbvnRdvfw5ptvVlZWnnzyyel/0S9/+cvHH38iujx27JibbropXKivr//61y9ZvHhxcx7qv/3bGTfeeGO48OKLL950081Nbj9w4MD77/9tGFeTW7799tuXXnpZdLlHjx5PPPG41QiAwPqkePbZZ0MMRZdDCSVv/8tf/vLII48kr5533rnnnXdedHnNmjUvvfRSdLl3794hOBrt869//WsosPnz56feuGrVqjlz5kyZMiV0zx13/Gro0KGpPw09Fx7Jli1bmvOYwx529KOXX365tLQ0unzAAQfsaLNly5ZdfPFXH330z6effnqaXzR//oLkMw2BmMy4kpKSDz74oDkP9aCDDko+/eSu0li+fHkzv642JGlyh9sGLgDs0/b5Q4RZWVnJy6kvnEyZcm/qZvfee992N0u9e+Tuu+8+++xxjeoq1YwZM04++ZTnnnsu9cZYLNaxY8dmPuaOHXfYtV26dEle7ty5c5pnvWnTpnHjCh599NE0vyh1D6mXMzKaG9bJe6V+O20aqY+/ib957dun+VMAgH1aRpt8VjNnzgwZlHpL6KFZs2YlDyDuyPTp07/97e+kvqZ13HHHHXXUUTU1NbNnz37vvfeiG9evX//lL3/lb397My8vL5kL/fv3j8fj2w2RRCKxdu3abV8q22XRq0SVlZVf+tKX77nnN1/72td26u59+/bd0UONnl14vo1uzM3NHTFixHbvsmbNmmYecNxHjRo1Kj8/3z8WEAnLISwKc4D9MbCmTLm3rq4u9ZZwNdz4m9+kO0Fp2Obaa7+fzKBDDz30vvvuPfnkk6PXWkLNPPLII1de+e3NmzdHVXHTTTc/+OAD0cYHHHDAG2+8HrpnuwkSeuXTnz4p2WctqLa29utfvyTU0ve+973m/pFnZDzxxOPhae4osM4+e9yLL77Y6MZTTz01PMHtbn///fdfcsmENrxInnjiCf9SQNINN9xgCLA/Btbq1av/9Kc/bXt7uPHHP77lwAMP3NEdX3vttblz50aXMzMzH374oREjRiR/mpWVVVhYGFIp+dbs8N/d8vLy3NzcdluPoGVnZ+9ozw0NDc153/cuu/rqa0L2Re9hb47u3bun+Wnzj3UCANvVBr+m4YEHHki+2/2EE04YNmxYdDnEUPhRmjumvq3qjDPOSK2rpIsvvnjAgAHR5fXr18+ePbs5D6murq6Zb/3eZTffPPH737+uRXa1sw91155a898HBgACa2+KXiUqKvq4oiZOvPm6676f0l4PtvvnN7mnWrp0WfJyMssayczMPOKII5JXy8rKmvPAOnbs2Mw3ie+O22677dJLL2toaNjN/bTeQ62srAxVum6r1I98AkAb06ZeRejatevTTz/99ttvR1cPO+ywMWPGVFdX9+/ff8WKFeGWBQsWTJs2LWy23bunvrM7I2OHR/SS36fVbutboLbdYMOGDVu2bEnNlLDnRu8JayVTpkwJv72o6HdpPoGYavPmzSF6GhXVtu9w301h7P/zP79//fXXlyxZEh5e9IrXnhkIAAis3RXKYPLku5JXL730m522uuSSS37yk59EN4YNrrrqO9u9e2pnpDnslfqj7b7Yc9lll4fOa3SX5LehtrjMzMz6+vpk6j388MNVVVUPPFCUnZ3d5MG7//zPX/76179udGMzvy61OcID+NnPfjZp0i+iTwYAwH6i7RwibN++/SuvvPL8889HV3v27HnhhRdGl7/2tcJu3bpFl2fMmBE2S/0SphZXUVGx/p/F4/HdP3K3I3369Hnkkf+b+ub9xx57bNy4gvBLk896RzZt2rR+Gy342tI111x7880T1RUA+5u28wpWaKbJk+8KxRBdLSwsTH53+cCBA8ePHz9lypR2W1+e+c1v7mnVd0S1+CG29KqrqwsKCvLy8kJULVv2j7eRvfDCC+Fq+k8Ltmvl43RPP/307bffnnrL4MGDw+OMPqUY+q+kpMQKBEBgfaKFVliyZEl0uXPnzhMmXJL600sv/eb9998f9cTy5ctb9ZGcfvpns7OzUxuuoaFh2rRpyfhrcRUVFcOHD5827X/POecL77zzTnTjtt9lta0RI/7l3HPPbZSb4Y4fffTR7j+qELLJy7m5uZMn/3cIweQ72ObOnTts2LFWIAACa59xzjnnDB48OPWW0B9nnnnm44/viTMKX3/99dveOHjwUcmTDLaS8JRDY5199ri33nqrmXe5cKtGN44de8b06dN388FUVlbOmTMnefXaa685//zzUzdInkESANqe9m3yWV1++WXb3vitb12xtx5PTU1N670HK1VeXt706dN28ywWLXJKn40bN65fvz551Yk1ABBY+7ZTTjll9OjR295++umnjxw5ss3/ifbu3fupp/569tln792HkblV8urSpUv33ZGWlZWVl/vWLviHsBya+RWAILDalCuv/NZ238PeoUOH8KO98pA6derUnM8thoed+iWou3zKmm7duv3xj3+46KKLdu3uLfId6z169Ej9Rtbbbvuv5Bvwkw9yX/kbdcwxx1x77TX+sYBIWA5hUZgDNPEf0zb2fAYPHnzWWWft6KfnnHPOwIEDFy9e3Bq/+plnnlm9evV2f1RXV1dRUbHt7aE5HnvssdRbUvdQWlo6efLk1J+ef/75vXv3bs6DCXH24IMPdO/e/a677tr2p7Nnz164cOGOIq9RCe2asJ8vfvG85OcEZ86cOWLECePGjTvyyCOi97l/+KH/BwyAwNpHfO97303zJeZdu3b97nevuuqq77bGr/6P/7jpjTfe2Km7LFiw4Morv72jn87aKvWWESNGNDOwIpMn/3d2dvatt97a6Pbf/a5o2+8XbXHf+MY3Hnro4ddeey26umrVqnvuuceSA2B/0KYOEfbt27fRR9W2dcEFF/Tq1as1fnvqW46am7c7eTBuR2dRTOPnP//ZL34xqd0/n9WnmSfS2U1dunT5wx8eOemkkywzAATWPqaysjJ5+bLLLs3Ozk6/fairCRMmbPfuW7ZsSV6urd3hN3Cmfr9A6hd1pt49veTOd/bzesmPIqbeMTyF9KfEue666371q9tTT6HY/K9Cbc6TSh1CVVVV6o8OPvjg6dOn3XnnHcOGDUt9AGn+EAGgDfinN4M3eeq6T6AnnngimQuf/exnmwysYP369TNmzIguZ2VljRkzJnplaObMmUuWLInFYmEORx11VKNv0kp65ZVXVq5cGW02fPjwgQMHRre/+OKLa9asafI74sO9jj766Pz8/HA5bB/u1fyvlT/ttNNycnLabX2rVklJSXTHzMzM8BSafEf8qlWrkl9tP2/evEWLFjXnoR5yyCHHH398+s3C0MLoooGE+Yc/hW33HCLs/fffD3OrqKjYNitDe6V559xeF2ZeUFBQVFTk3wtot/U8GcXFxfF43CigcVSl/Odvnw8sEFggsOCTFljtjQMAoGUJLAAAgQUAILAAAAQWAAC7zqcIoQnxiopOHTtlZXUxCmj39y+uq6qp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';
        doc.addImage(step1, 'PNG', 12, 55, 67.73, 47.92);

        // STEP 2
        doc.setTextColor(9, 27, 38);
        doc.setFontSize(14);
        doc.text('Step 2', 100, 50, null, 0);
        var step2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA1AAAAEcCAMAAAD+wKU9AAABNVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAABPT0/v7+/f398PDw9vb28fHx8CAgKAgIDPz887OzsKCgr8/Pzj4+Ourq6np6dlZWX4+PjV1dXGxsadnZ2Pj49KSkowMDDe3t7b29vAwMC3t7eKiooGBgbT09NYWFhBQUEpKSkjIyOYmJhycnIXFxfz8/Ozs7OioqKFhYV6enp2dnZnZ2deXl5HR0c2NjYbGxsUFBTs7Ozp6enKysq7u7uTk5Nra2tTU1Pl5eW4uLi+sLzZAAAAK3RSTlMA8P0DCffLaOzTrJWNh3VIOicT5uDZtKace1ZPNBrDgm9hQS0gDb65oFvzn/FdUwAACdVJREFUeNrs3NdOlFEYRmFkKFKliIKACgqi3xoFfmCo0qSqCHYxdu//GgwkaiRzMuN3uNYl7OTJPnn3bhgsMLMqFV0NtYeZVa+xJKj/yLvaY7jQSF2gynYeR2Urn1TKdtYp0FoXqLDzmAmL8mzYWY+AKUEJSlB5oNoEJShB5YEqJgQlKEGlgWJcUPU3vxQWTx6H/QHVLSizPFDtgjLLA9UvKLM8UIwKyiwJVAHDgjJLAnUAXYIySwJVgUlBmeWBulQSlFkOqOkD6BWUWRKoBRgTlFkSqGPoEFS97e6ExeF62G9QK9AiKMexjmOTQO1AY5OgBCWoHFDxCXoEJShBJYHagtuCEpSgkkDNwXVBCUpQSaD2YEBQghJUEqjPQJ+gBCWoHFBxBFcEJShBJYF6CkOCEpSgkkBtwjVBCUpQSaDWoV9QghJUEqi1Au4Kqq7m9sJiZTPsL6jYhhuCMksC9R46BWWWBGoDbgrKLAnUITSXBGWWA2qxAncEZZYDKp5Bq6DMkkC9g0FBmSWBWoY2QZklgVqCxiZBmeWAihPoEZRZEqgydAvKLAnUG2gXVB3NzoXF6kLYP6C+wVVBuTZ3bZ4E6iHQJyhBCSoHVDyHYUEJSlBJoD7ALUEJSlBJoL7DPUEJSlBJoL7CZUEJSlBJoNYOoFdQghJUDqj4CPcFJShBJYH6AZ2CEpSgkkC9hhZBCUpQSaB2oLkkqFrb3g+Lma2wC6BiGkYEZZYE6hRaBWWWBOotTAnKLAnUKxgQlFkSqC9QTAjKLAdUzMK4oMySQP2EIUGZJYHah3ZBmSWB2oV+QZklgXpZwKigzHJAnT+DF5RZEqhV6BJUbc0sh8WGn6lVA/UCJgXl2ty1eRKoeXhQEpSgBJUDarECvYISlKByQMUCjAlKUIJKAnUMHYISlKB+sXcfOUEAUBRFI9WOlRZAVKz/inTpvQoBC2DBbuL+l2DCWIrJG967hzN7+T8EagZaBCUoQYVArUJDk6AEJagMqPoKNwQlKEGFQC1Dv6AEJagQqDHoEJSgBBUCtQF3BSUoQYVAfQNuCeo/Gp8qq9X5sn+Bql1oE5RZCNQ2dAnKLARqCdoFZRYCtQAXBWUWAjU3CgOCMsuAqhXoFpRZCNRHuCoosxCoRegTlFkI1Dw0NwrKLANq8hU8FJRZBlTtQKugzt36Wlm9Xig7AdQH6BSU41jHsSFQ03BJUIISVAjUFDQ0CUpQgsqAqi/wQFCCElQI1Au4LihBCSoE6gAuC0pQggqB+gl3BCUoQYVADQK9ghKUoDKgjv+uCUpQggqB+gTXBCUoQYVA7cETQQlKUCFQP+CCoM7Z2EZZzSyVnQhqbgtuCsosA6qO4JmgzEKghuGKoMxCoPahRVBmIVBr0NwoKLMMqBqCHkGZhUB9hlZBmYVAHcJTQZmFQL2Hu4IyC4H6DjwSlFkGVI1Am6DMQqC2oUtQ52lkrKxmJ8pOA7UJ7YJybe7aPARqHW4LSlCCCoF6Nwq9ghKUoDKgagW6BSUoQYVAzcI1QQlKUCFQe/BYUIISVAjUODxvFJSgBJUBdfx3TVCCElQGVE3AfUEJSlAhUG/giqAEJagQqBloEdTZrWyW1fBy2emgXkJDk6DMMqDqLdwQlFkI1DL0C8osBOoAOgRlFgL1B+4IyiwEahC4JSizDKjahTZBmYVAbcM9QZmFQP2CdkGZhUAtwEVBmYVAzW3BgKDMMqDqCLoFdUbD02W16DG1c4D6DVcF5drctXkI1D70CUpQggqBmofmRkEJSlAZUJND0CMoQQkqA6p2oFVQghJUCNQhdApKUIIKgZqGS4ISlKD+snNny0AAcBTGJ6Rd0aJCoST9v5pk3/c1UrSMopX3f4XuGxpmzuX3vcPv7swJgTqGhj5BCUpQGVB1AL2CEpSgQqCOoEVQghJUCNQ6XBWUoAQVArUKdwT130Ymymp5tuwMoHaBLkGZZUDVNnQIyiwEah9uCMosBGoH+gVlFgI1AhcEZRYCNb4BrYIyy4CqURgQlFkI1CBcE5RZCNQUNAvKLARqBRqaBGWWAVWH0Cmo01tdKavNubKzgfoK3YJyHOs4NgRqGNoFJShBhUDtwV1BCUpQIVA/gDZBCUpQGVD1Dm4KSlCCCoF6Cw8EJShBhUAtwD1BCUpQIVBzcFtQghJUCNTMEDwVlKAElQFVS/BQUIISVAjUNFwXlKAEFQI1D48EdVrDa2U1tVB2VlCbcLFRUGYZUONj8ERQZhlQtQU9gjILgfoC9wVlFgI1CVcEZRYCNQENTYIyy4CqD3BLUGYhUC+hRVBmIVCfoF1QZiFQv+COoMxCoF4BbYIyy4CqbbgpqBN7M1xW06Nl5wC1D48F5drctXkI1G/oF5SgBBUC9RMuC0pQggqBmtmAVkEJSlAZUPUNBgQlKEGFQP2B64ISlKBCoD5Cs6AEJagQqFm42CgoQQkqA6peQ6egBCWoEKgtuCQoQQkqBOozPBfUCS2tl9XgYtm5QO3BFUGZhUAdw1CfoMwyoOoAegVlFgJ1BC2CMguBWoergjILgVqF24IyC4HaHYIuQZllQNU2dAjKLARqGm4IyiwEageeCcosBGoEXjQKyiwDanwMWgX1b4OTZTXvmdq5QdUo9AjKtblr8xCo93BNUIISVAjUFDQLSlCCCoFahoYmQQlKUBlQdQi3BCUoQYVALUK3oAQlqBCoYWgXlKAEFQK1BncFJShBhUB9B9oEJShB/W3v7nWiCoM4DsvGYv2IWhijFlJoN+MaXTABv0BNTCQhUEHB/V8HAd4GwiacZYopnt8lnJyn+7+ZGlBxmPkcKKCAKgJ1kPkGKKCAKgK1n/kKqOtt74Ti78/QdFC/MudASUWgfiwzPwAl1YCKP5lvgZKKQJ1mPgVKKgK1l/kOKKkI1P+Lu2tASQWgxjP490BJFaDG3TWgpCJQJ5mvgZKKQO1mPgJKKgK1kzl7CJTpkelRDag4znwBlHGscWwRqI+Zz4ACCqjVoD5N6SjzMVBAAbUK1PReAgUUUHWglkABBdRKUMuNac03gQIKqJWgNh7cOTd2gQIKqBsBFRFAjYBqFlBAAQUUUCOgmgUUUEAVtvUvFN/2Q0BJQEl9A0oCSuoZUBJQUs+AkoCSegaUBJTUM6AkoBr1ZSsU37+GgLI2tzYHqllAAQUUUECNgGoWUEABBRRQI6CaBRRQQAEF1AioZgEFFFBAATUCqllAAQWU6VGE6dFVQEltA0oCSuoZUBJQUs+AkoCSegaUBJTUM6AkoKSeAXXfPu+GYs+iEShrc2vzCKCaBRRQQAEF1KgNqIUuy9OFFr/PFrpoe01Q0rWWqdE6oGapy/xJPsPN5muAekKUdGuzzemezgFlYc53pET5YwAAAABJRU5ErkJggg==';
        doc.addImage(step2, 'PNG', 100, 55, 71.8, 24.05);

        // STEP 3
        doc.setTextColor(9, 27, 38);
        doc.setFontSize(14);
        doc.text('Step 3', 190, 50, null, 0);
        var step3 = 'data:image/png;base64,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';
        doc.addImage(step3, 'PNG', 190, 55, 45.13, 26.33);

        // STEP 4
        doc.setTextColor(9, 27, 38);
        doc.setFontSize(14);
        doc.text('Step 4', 257, 50, null, 0);
        var step4 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQkAAAE3CAYAAAC5GLS5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjU1ODUwN0E1OTg3MTExRThBRjk3Q0UxNjE2RUQyREFFIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjU1ODUwN0E2OTg3MTExRThBRjk3Q0UxNjE2RUQyREFFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTU4NTA3QTM5ODcxMTFFOEFGOTdDRTE2MTZFRDJEQUUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTU4NTA3QTQ5ODcxMTFFOEFGOTdDRTE2MTZFRDJEQUUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5Lhm/lAAAeF0lEQVR42uyd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';
        doc.addImage(step4, 'PNG', 257, 55, 24.44, 26.33);

        // WARNING
        doc.setFillColor(168, 208, 225);
        doc.rect(12, 170, 273, 27, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(15);
        doc.text('WARNING', 15, 178, null, 0);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text('There is no way to recover your funds if you lose your wallet keys. Without your PRIVATE SPEND and PRIVATE VIEW keys you cannot ever recover your Plenteum', 15, 183, null, 0);
        doc.text('so keep the PDF or paper print out VERY SAFE. Remember that ANYONE who has access to your SPEND key can spend your Plenteum. This PDF is worth whatever', 15, 188, null, 0);
        doc.text('you transfer to it. KEEP IT SAFE.', 15, 193, null, 0);


        try {
            doc.save('wallet_backup.pdf');
        } catch(e) {
            alert('Error ' + e);
        }

    }

}