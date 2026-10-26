type BrowserSession = { id: string; username: string; token: string };
const STORAGE_KEY = "kritzel-session";

function savedSession(): BrowserSession | null {
    try {
        if (typeof localStorage === "undefined") return null;
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        if (
            value && typeof value.id === "string" && typeof value.username === "string" &&
            typeof value.token === "string" && /^[a-f0-9]{64}$/.test(value.token)
        ) return value;
    } catch {
        // Unavailable storage and malformed old state both mean signed out.
    }
    return null;
}

const saved = savedSession();

export class AppState {
    static readonly currentUserId = $<string | null>(saved?.id ?? null);
    static readonly currentUsername = $<string | null>(saved?.username ?? null);
    static readonly sessionToken = $<string | null>(saved?.token ?? null);

    static setSession(user: BrowserSession) {
        this.currentUserId.val = user.id;
        this.currentUsername.val = user.username;
        this.sessionToken.val = user.token;
        try {
            if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } catch { /* The current tab can still use the in-memory session. */ }
    }

    static clearSession() {
        this.currentUserId.val = null;
        this.currentUsername.val = null;
        this.sessionToken.val = null;
        try {
            if (typeof localStorage !== "undefined") {
                for (const key of [STORAGE_KEY, "kritzel_user_id", "kritzel_user_name"]) {
                    localStorage.removeItem(key);
                }
            }
        } catch { /* Storage can be blocked by browser settings. */ }
    }
}
