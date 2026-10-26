import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { hashPassword, verifyPassword } from "./passwords.ts";

Deno.test("password hashes use random salts and verify the password", async () => {
    const first = await hashPassword("test-password");
    const second = await hashPassword("test-password");
    assertNotEquals(first, second);
    assertEquals(first.startsWith("pbkdf2-sha256$600000$"), true);
    assertEquals(await verifyPassword("test-password", first), true);
    assertEquals(await verifyPassword("wrong-password", first), false);
});

Deno.test("password verification rejects malformed and excessive hash parameters", async () => {
    for (const value of ["", "$", "zz$abcd", "pbkdf2-sha256$999999999$00$00"]) {
        assertEquals(await verifyPassword("test-password", value), false);
    }
});

Deno.test("password verification preserves legacy 100000-iteration accounts", async () => {
    const salt = new Uint8Array(16);
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode("legacy-password"),
        "PBKDF2",
        false,
        ["deriveBits"],
    );
    const result = new Uint8Array(
        await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
            key,
            256,
        ),
    );
    const hash = Array.from(result, (byte) => byte.toString(16).padStart(2, "0")).join("");
    assertEquals(await verifyPassword("legacy-password", `${"00".repeat(16)}$${hash}`), true);
});
