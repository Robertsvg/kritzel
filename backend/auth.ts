import { StoredUser } from "common/auth/users.ts";
import { StoredSurvey } from "common/surveys/surveys.ts";
import { assertRateLimit } from "common/security/rate-limit.ts";
import { hashPassword, verifyPassword } from "./security/passwords.ts";
import { sessions } from "./security/sessions.ts";

type AuthResponse = {
    success: boolean;
    error?: string;
    userId?: string;
    username?: string;
    sessionToken?: string;
};

@endpoint
export class AuthEndpoint {
    @property
    static async registerUser(username: string, password: string): Promise<AuthResponse> {
        if (typeof username !== "string" || typeof password !== "string") {
            return { success: false, error: "Invalid input length" };
        }
        const cleanUsername = username.trim();
        if (password.length < 6 || password.length > 1024) {
            return { success: false, error: "Invalid input length" };
        }
        if (!/^[a-zA-Z0-9_]{3,32}$/.test(cleanUsername)) {
            return { success: false, error: "Username contains invalid characters" };
        }
        try {
            assertRateLimit({
                key: `register:${datex.meta.caller.name}`,
                limit: 5,
                windowMs: 3_600_000,
                action: "register account",
            });
        } catch {
            return { success: false, error: "Registration temporarily unavailable" };
        }
        if (StoredUser.usernameExists(cleanUsername)) {
            return { success: false, error: "Username already exists" };
        }
        const passwordHash = await hashPassword(password);
        // Another request may have registered the name while hashing was awaited.
        if (StoredUser.usernameExists(cleanUsername)) {
            return { success: false, error: "Username already exists" };
        }
        const id = crypto.randomUUID();
        StoredUser.init({ id, username: cleanUsername, passwordHash, surveyIds: [] });
        return { success: true, userId: id };
    }

    @property
    static async verifyUserLogin(username: string, password: string): Promise<AuthResponse> {
        const failure = { success: false, error: "Login failed" };
        if (typeof username !== "string" || typeof password !== "string" || password.length > 1024) {
            return failure;
        }
        try {
            assertRateLimit({
                key: `login:${datex.meta.caller.name}`,
                limit: 20,
                windowMs: 60_000,
                action: "log in",
            });
            const user = StoredUser.getByUsername(username.trim());
            if (!await verifyPassword(password, user._passwordHash)) return failure;
            return {
                success: true,
                userId: user.id,
                username: user.username,
                sessionToken: sessions.create(user.id),
            };
        } catch {
            return failure;
        }
    }

    @property
    static async logout(sessionToken: string): Promise<void> {
        sessions.revoke(sessionToken);
    }

    @property
    static async linkSurveyToUser(
        sessionToken: string,
        surveyId: string,
        administrationToken: string,
    ): Promise<boolean> {
        const userId = sessions.resolve(sessionToken);
        if (!userId) return false;
        try {
            StoredSurvey.getById(surveyId).getAdministrativeConfiguration(administrationToken);
            StoredUser.getById(userId).addSurvey(surveyId);
            return true;
        } catch {
            return false;
        }
    }

    @property
    static async getUserSurveys(sessionToken: string): Promise<string[]> {
        const userId = sessions.resolve(sessionToken);
        if (!userId) throw new Error("Unauthorized");
        return StoredUser.getById(userId).surveyIds.filter((id) => StoredSurvey.exists(id));
    }
}
