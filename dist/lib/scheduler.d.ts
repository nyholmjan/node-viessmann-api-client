export declare type OnTick = () => void;
export declare class Scheduler {
    private readonly cronString;
    private readonly onTick;
    private timer;
    constructor(cronString: string, onTick: OnTick);
    start(): void;
    stop(): void;
    isStopped(): boolean;
}
