import { CronJob } from 'cron';
import { log } from './logger';
export type OnTick = () => void;
export class Scheduler {

    private timer: CronJob = null;

    constructor(private readonly intervalInMs: number, private readonly onTick: OnTick) { }

    public start(): void {
        if (this.isStopped()) {
            this.timer = new CronJob('* * * * *', () => this.onTick());
            this.timer.start();
            log('Scheduler started', 'debug');
        }
    }

    public stop(): void {
        if (!this.isStopped()) {
            this.timer.stop();
            this.timer = null;
            log('Scheduler stopped', 'debug');
        }
    }

    public isStopped(): boolean {
        return this.timer === null;
    }
}
