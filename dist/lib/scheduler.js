"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduler = void 0;
const cron_1 = require("cron");
const logger_1 = require("./logger");
class Scheduler {
    constructor(intervalInMs, onTick) {
        this.intervalInMs = intervalInMs;
        this.onTick = onTick;
        this.timer = null;
    }
    start() {
        if (this.isStopped()) {
            this.timer = new cron_1.CronJob('* * * * *', () => this.onTick());
            this.timer.start();
            logger_1.log('Scheduler started', 'debug');
        }
    }
    stop() {
        if (!this.isStopped()) {
            this.timer.stop();
            this.timer = null;
            logger_1.log('Scheduler stopped', 'debug');
        }
    }
    isStopped() {
        return this.timer === null;
    }
}
exports.Scheduler = Scheduler;
//# sourceMappingURL=scheduler.js.map