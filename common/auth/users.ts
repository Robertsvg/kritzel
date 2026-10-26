import { inferType } from "datex-core-legacy/types/struct.ts";

type PrivateUser = {
    id: string;
    username: string;
    passwordHash: string;
    surveyIds: string[];
};

const privateUsers = eternal ?? $(new Map<string, PrivateUser>());

export const StoredUser = struct(
    "StoredUser",
    class {
        constructor(public privateData: PrivateUser) {}

        static init(fields: PrivateUser) {
            privateUsers.set(fields.id, {
                id: fields.id,
                username: fields.username,
                passwordHash: fields.passwordHash,
                surveyIds: [...fields.surveyIds],
            });

            // @ts-ignore due to faulty type definition checks
            return new StoredUser(privateUsers.get(fields.id)!);
        }

        static getById(id: string) {
            if (!StoredUser.exists(id)) {
                throw new Error(`User with id ${id} not found`);
            }

            // @ts-ignore due to faulty type definition checks
            return new StoredUser(privateUsers.get(id)!);
        }

        static getByUsername(username: string) {
            const user = [...privateUsers.values()].find((user) => user.username === username);
            if (!user) throw new Error(`User with username ${username} not found`);

            return StoredUser.getById(user.id);
        }

        static exists(id: string) {
            return privateUsers.has(id);
        }

        static usernameExists(username: string) {
            return [...privateUsers.values()].some((user) => user.username === username);
        }

        @property
        get id() {
            return this.privateData.id;
        }

        @property
        get username() {
            return this.privateData.username;
        }

        @property
        get surveyIds() {
            return [...this.privateData.surveyIds];
        }

        get _passwordHash() {
            return this.privateData.passwordHash;
        }

        set _passwordHash(value: string) {
            this.privateData.passwordHash = value;
        }

        addSurvey(id: string) {
            if (!this.privateData.surveyIds.includes(id)) {
                this.privateData.surveyIds.push(id);
            }
        }
    },
);

export type StoredUser = inferType<typeof StoredUser>;
