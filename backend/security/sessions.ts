type Session = { userId: string; expiresAt: number };

export class SessionStore {
    private readonly entries = new Map<string, Session>();

    constructor(
        private readonly lifetimeMs = 8 * 60 * 60 * 1000,
        private readonly clock: () => number = Date.now,
    ) {}

    create(userId: string): string {
        const now = this.clock();
        for (const [token, session] of this.entries) {
            if (session.expiresAt <= now) this.entries.delete(token);
        }
        // Bound process-local memory even if accounts create many active sessions.
        if (this.entries.size >= 10_000) this.entries.delete(this.entries.keys().next().value!);
        const token = Array.from(
            crypto.getRandomValues(new Uint8Array(32)),
            (byte) => byte.toString(16).padStart(2, "0"),
        ).join("");
        this.entries.set(token, { userId, expiresAt: now + this.lifetimeMs });
        return token;
    }

    resolve(token: string): string | undefined {
        const session = this.entries.get(token);
        if (!session) return undefined;
        if (session.expiresAt <= this.clock()) {
            this.entries.delete(token);
            return undefined;
        }
        return session.userId;
    }

    revoke(token: string): void {
        this.entries.delete(token);
    }
}

export const sessions = new SessionStore();
