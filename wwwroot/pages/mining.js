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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "../lib/numbersLab/DestructableView", "../lib/numbersLab/VueAnnotate", "../lib/numbersLab/DependencyInjector", "../model/Wallet", "../model/AppState"], function (require, exports, DestructableView_1, VueAnnotate_1, DependencyInjector_1, Wallet_1, AppState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var wallet = DependencyInjector_1.DependencyInjectorInstance().getInstance(Wallet_1.Wallet.name, 'default', false);
    var ID_LOGIN = '0';
    var ID_SUBMIT = '1';
    var ID_GET_JOB = '2';
    var ID_KEEP_ALIVE = '3';
    AppState_1.AppState.enableLeftMenu();
    var Pool = /** @class */ (function () {
        function Pool(url, login, pass, algorithm, algorithmVariant) {
            this.poolLogin = '';
            this.poolPass = 'x';
            this.poolId = '';
            this.poolUrl = '';
            this.logged = false;
            this.pendingJob = true;
            this.algorithm = 'cn';
            this.algorithmVariant = 1;
            this.intervalKeepAlive = 0;
            this.reconnectCount = 0;
            this.maxReconnectCount = 5;
            this.validShareCount = 0;
            this.invalidShareCount = 0;
            this.onNewJob = null;
            this.onClose = null;
            this.poolLogin = login;
            this.poolPass = pass;
            this.poolUrl = url;
            this.algorithm = algorithm;
            this.algorithmVariant = algorithmVariant;
            this.reconnectCount = 0;
            this.connect();
        }
        Pool.prototype.connect = function () {
            this.socket = new WebSocket(this.poolUrl);
            var self = this;
            this.socket.onopen = function () {
                console.log('Connected');
                self.authOnPool();
            };
            this.socket.onmessage = function (ev) {
                var data = ev.data;
                try {
                    var decoded = JSON.parse(data);
                    if (decoded !== null) {
                        var methodId = decoded.id;
                        var method = decoded.method;
                        if (methodId === ID_LOGIN || method == 'login') {
                            self.handlePoolLogin(decoded.id, decoded.method, decoded.result);
                        }
                        else if (methodId === ID_GET_JOB || method == 'job') {
                            self.handlePoolNewJob(decoded.id, decoded.method, decoded.params);
                        }
                        else if (methodId === ID_SUBMIT) {
                            self.handleSubmitResult(decoded.id, decoded.error, decoded.result);
                        }
                    }
                    else {
                        console.error('Received invalid message from the pool', data);
                    }
                }
                catch (error) {
                    console.log('POOL ERROR:', error, data.toString());
                }
                //client.destroy(); // kill client after server's response
            };
            this.socket.onclose = function () {
                ++self.reconnectCount;
                if (self.reconnectCount < self.maxReconnectCount) {
                    setTimeout(function () {
                        self.connect();
                    }, 10 * 1000);
                }
                else {
                    console.log('Connection closed');
                    self.logged = false;
                    if (self.intervalKeepAlive !== 0)
                        clearInterval(self.intervalKeepAlive);
                    if (self.onClose)
                        self.onClose();
                }
            };
            if (this.intervalKeepAlive !== 0)
                clearInterval(this.intervalKeepAlive);
            this.intervalKeepAlive = setInterval(function () {
                self.keepAlive();
            }, 30 * 1000);
        };
        Pool.prototype.stop = function () {
            clearInterval(this.intervalKeepAlive);
            this.socket.close();
        };
        Pool.prototype.logOn = function () {
            var self = this;
            if (this.logged)
                return Promise.resolve();
            return new Promise(function (resolve, reject) {
                while (!self.logged) { }
                resolve();
            });
        };
        Pool.prototype.handlePoolLogin = function (requestId, requestMethod, requestParams) {
            if (requestParams !== null) {
                this.logged = true;
                this.poolId = requestParams.id;
                if (requestParams.job !== null) {
                    requestParams.job.algo = 'cn';
                    requestParams.job.variant = 1;
                    this.pendingJob = requestParams.job;
                    if (this.onNewJob)
                        this.onNewJob();
                }
            }
        };
        Pool.prototype.handlePoolNewJob = function (requestId, requestMethod, requestParams) {
            requestParams.algo = 'cn';
            requestParams.variant = 1;
            this.pendingJob = requestParams;
            if (this.onNewJob)
                this.onNewJob();
        };
        Pool.prototype.handleSubmitResult = function (id, error, result) {
            if (error === null) {
                ++this.validShareCount;
            }
            else {
                ++this.invalidShareCount;
                console.log('INVALID SHARE');
            }
        };
        Pool.prototype.authOnPool = function () {
            this.socket.send(JSON.stringify({
                id: '0',
                method: 'login',
                params: {
                    login: this.poolLogin,
                    pass: this.poolPass
                },
            }) + '\n');
        };
        Pool.prototype.sendWorkerJob = function (share) {
            if (share.job_id !== this.pendingJob.job_id)
                return;
            var params = share;
            params.id = this.poolId;
            var rawData = JSON.stringify({
                id: ID_SUBMIT,
                method: 'submit',
                params: {
                    id: share.id,
                    job_id: share.job_id,
                    nonce: share.nonce,
                    result: share.result,
                },
            });
            this.socket.send(rawData);
        };
        Pool.prototype.askNewJob = function () {
            this.socket.send(JSON.stringify({
                id: ID_GET_JOB,
                method: 'getJob',
                params: {},
            }));
        };
        Pool.prototype.keepAlive = function () {
            this.socket.send(JSON.stringify({
                id: ID_KEEP_ALIVE,
                method: 'keepalived',
                params: {
                    id: this.poolId
                },
            }));
        };
        Pool.prototype.setJobResponse = function (job) {
            this.sendWorkerJob(job);
        };
        Object.defineProperty(Pool.prototype, "isLogged", {
            get: function () {
                return this.logged;
            },
            enumerable: true,
            configurable: true
        });
        return Pool;
    }());
    var MiningView = /** @class */ (function (_super) {
        __extends(MiningView, _super);
        function MiningView(container) {
            var _this = _super.call(this, container) || this;
            _this.workersThread = [];
            _this.pool = null;
            _this.hashCount = 0;
            _this.intervalRefreshHashrate = 0;
            _this.lastSharesCount = 0;
            if (!config.testnet) {
                _this.miningAddressesAvailable.push({
                    address: '5qfrSvgYutM1aarmQ1px4aDiY9Da7CLKKDo3UkPuUnQ7bT7tr7i4spuLaiZwXG1dFQbkCinRUNeUNLoNh342sVaqTaWqvt8',
                    label: 'Donation - WebWallet'
                });
                _this.miningAddressesAvailable.push({
                    address: '5nYWvcvNThsLaMmrsfpRLBRou1RuGtLabUwYH7v6b88bem2J4aUwsoF33FbJuqMDgQjpDRTSpLCZu3dXpqXicE2uSWS4LUP',
                    label: 'Donation - Plenteum'
                });
                _this.miningAddressesAvailable.push({
                    address: '9ppu34ocgmeZiv4nS2FyQTFLL5wBFQZkhAfph7wGcnFkc8fkCgTJqxnXuBkaw1v2BrUW7iMwKoQy2HXRXzDkRE76Cz7WXkD',
                    label: 'Donation - Plenteum exchange listing'
                });
                _this.miningAddress = '5qfrSvgYutM1aarmQ1px4aDiY9Da7CLKKDo3UkPuUnQ7bT7tr7i4spuLaiZwXG1dFQbkCinRUNeUNLoNh342sVaqTaWqvt8';
            }
            else {
                _this.miningAddressesAvailable.push({
                    address: '6dRJk2wif2c1nGWYEkd1k49D88SEg49E95j9YE4jb8SyAiB6aTwRBqcN2jndBB19zaAr9ZNrWGjKgLa6dJcL7EXFKAWhSFw',
                    label: 'Test wallet'
                });
                _this.miningAddress = '6dRJk2wif2c1nGWYEkd1k49D88SEg49E95j9YE4jb8SyAiB6aTwRBqcN2jndBB19zaAr9ZNrWGjKgLa6dJcL7EXFKAWhSFw';
            }
            if (wallet !== null)
                _this.miningAddressesAvailable.push({
                    address: wallet.getPublicAddress(),
                    label: 'Your wallet'
                });
            var self = _this;
            _this.intervalRefreshHashrate = setInterval(function () {
                self.updateHashrate();
            }, 1000);
            return _this;
        }
        MiningView.prototype.destruct = function () {
            clearInterval(this.intervalRefreshHashrate);
            return _super.prototype.destruct.call(this);
        };
        MiningView.prototype.start = function () {
            var self = this;
            if (this.pool !== null)
                this.pool.stop();
            this.updateThreads();
            this.running = true;
            this.pool = new Pool(config.testnet ? 'ws://testnet.pool.plenteum.com:8080' : 'wss://pool.plenteum.com/mining/', this.miningAddress + '+' + this.difficulty, 'webminer', 'cn-lite', 1);
            this.pool.onNewJob = function () {
                for (var _i = 0, _a = self.workersThread; _i < _a.length; _i++) {
                    var worker = _a[_i];
                    self.sendJobToWorker(worker);
                }
            };
            this.pool.onClose = function () {
                self.stop(false);
                self.pool = null;
            };
        };
        MiningView.prototype.stop = function (stopPool) {
            if (stopPool === void 0) { stopPool = true; }
            this.stopWorkers();
            if (stopPool) {
                if (this.pool !== null)
                    this.pool.stop();
                this.pool = null;
            }
            this.running = false;
        };
        MiningView.prototype.updateThreads = function () {
            if (this.threads < this.workersThread.length) {
                for (var i = this.threads; i < this.workersThread.length; ++i) {
                    this.workersThread[i].terminate();
                }
                this.workersThread = this.workersThread.slice(0, this.threads);
            }
            else if (this.threads > this.workersThread.length) {
                for (var i = 0; i < this.threads - this.workersThread.length; ++i) {
                    this.addWorker();
                }
            }
        };
        MiningView.prototype.sendJobToWorker = function (worker) {
            if (this.pool === null)
                return;
            var jbthrt = {
                job: this.pool.pendingJob,
                throttle: Math.max(0, Math.min(this.throttleMiner, 100))
            };
            worker.postMessage(jbthrt);
        };
        MiningView.prototype.sendJobToWorkers = function () {
            for (var _i = 0, _a = this.workersThread; _i < _a.length; _i++) {
                var worker = _a[_i];
                this.sendJobToWorker(worker);
            }
        };
        MiningView.prototype.addWorker = function () {
            var self = this;
            var newWorker = new Worker('./lib/mining/worker.js');
            newWorker.onmessage = function (message) {
                if (message.data === 'hash') {
                    ++self.hashCount;
                }
                else if (message.data !== 'hash') {
                    var json = JSON.parse(message.data);
                    if (self.pool === null)
                        return;
                    self.pool.setJobResponse(json);
                    ++self.validShares;
                }
                // sendJobToWorker(<Worker>message.target);
            };
            this.workersThread.push(newWorker);
            if (this.pool !== null && this.pool.isLogged) {
                this.sendJobToWorker(newWorker);
            }
        };
        MiningView.prototype.stopWorkers = function () {
            for (var _i = 0, _a = this.workersThread; _i < _a.length; _i++) {
                var worker = _a[_i];
                worker.postMessage(null);
            }
        };
        MiningView.prototype.threadsWatch = function () {
            this.updateThreads();
        };
        MiningView.prototype.updateHashrate = function () {
            this.hashRate = (this.hashCount - this.lastSharesCount);
            this.lastSharesCount = this.hashCount;
            if (this.hashRate > this.maxHashRate)
                this.maxHashRate = this.hashRate;
        };
        __decorate([
            VueAnnotate_1.VueVar('')
        ], MiningView.prototype, "miningAddress", void 0);
        __decorate([
            VueAnnotate_1.VueVar(1)
        ], MiningView.prototype, "threads", void 0);
        __decorate([
            VueAnnotate_1.VueVar(1000)
        ], MiningView.prototype, "difficulty", void 0);
        __decorate([
            VueAnnotate_1.VueVar(0)
        ], MiningView.prototype, "throttleMiner", void 0);
        __decorate([
            VueAnnotate_1.VueVar(0)
        ], MiningView.prototype, "validShares", void 0);
        __decorate([
            VueAnnotate_1.VueVar(0)
        ], MiningView.prototype, "hashRate", void 0);
        __decorate([
            VueAnnotate_1.VueVar(0)
        ], MiningView.prototype, "maxHashRate", void 0);
        __decorate([
            VueAnnotate_1.VueVar(false)
        ], MiningView.prototype, "running", void 0);
        __decorate([
            VueAnnotate_1.VueVar([])
        ], MiningView.prototype, "miningAddressesAvailable", void 0);
        __decorate([
            VueAnnotate_1.VueWatched()
        ], MiningView.prototype, "threadsWatch", null);
        return MiningView;
    }(DestructableView_1.DestructableView));
    new MiningView('#app');
});
