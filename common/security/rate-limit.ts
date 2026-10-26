type RateLimitOptions = {
    key: string;
    limit: number;
    windowMs: number;
    action: string;
};

type Attempts = { timestamps: number[]; expiresAt: number };

export class RateLimiter {
    private readonly attempts = new Map<string, Attempts>();
    private nextSweep = 0;

    constructor(private readonly clock: () => number = Date.now) {}

    assert(options: RateLimitOptions): void {
        if (
            !Number.isInteger(options.limit) || options.limit < 1 || !Number.isFinite(options.windowMs) ||
            options.windowMs <= 0
        ) {
            throw new RangeError("Rate limits require a positive limit and window");
        }
        const now = this.clock();
        if (now >= this.nextSweep || this.attempts.size >= 10_000) {
            for (const [key, entry] of this.attempts) {
                if (entry.expiresAt <= now) this.attempts.delete(key);
            }
            this.nextSweep = now + 60_000;
        }
        if (!this.attempts.has(options.key) && this.attempts.size >= 10_000) {
            throw new Error("Rate-limit capacity reached");
        }
        const recent = (this.attempts.get(options.key)?.timestamps ?? [])
            .filter((timestamp) => timestamp > now - options.windowMs);
        if (recent.length >= options.limit) {
            throw new Error(`Rate limit exceeded for ${options.action}`);
        }
        recent.push(now);
        this.attempts.set(options.key, { timestamps: recent, expiresAt: now + options.windowMs });
    }
}

const limiter = new RateLimiter();

export function assertRateLimit(options: RateLimitOptions): void {
    limiter.assert(options);
}
