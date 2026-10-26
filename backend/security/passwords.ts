const CURRENT_ITERATIONS = 600_000;
const LEGACY_ITERATIONS = 100_000;

function hex(bytes: Uint8Array): string {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"],
    );
    return new Uint8Array(
        await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
            key,
            256,
        ),
    );
}

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(password, salt, CURRENT_ITERATIONS);
    return `pbkdf2-sha256$${CURRENT_ITERATIONS}$${hex(salt)}$${hex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const parts = stored.split("$");
    let iterations: number;
    let saltHex: string;
    let hashHex: string;
    if (parts.length === 2) {
        iterations = LEGACY_ITERATIONS;
        [saltHex, hashHex] = parts;
    } else if (parts.length === 4 && parts[0] === "pbkdf2-sha256") {
        iterations = Number(parts[1]);
        [, , saltHex, hashHex] = parts;
    } else {
        return false;
    }
    if (
        !Number.isInteger(iterations) || iterations < 1 || iterations > 2_000_000 ||
        !/^[a-f0-9]{32}$/i.test(saltHex) || !/^[a-f0-9]{64}$/i.test(hashHex)
    ) return false;

    const salt = new Uint8Array(saltHex.match(/../g)!.map((byte) => parseInt(byte, 16)));
    const actual = await derive(password, salt, iterations);
    const expected = new Uint8Array(hashHex.match(/../g)!.map((byte) => parseInt(byte, 16)));
    let difference = 0;
    for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
    return difference === 0;
}
