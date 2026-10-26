import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { SessionStore } from "./sessions.ts";

Deno.test("sessions require a generated token rather than a user identifier", () => {
    const store = new SessionStore();
    const token = store.create("user-1");
    assertEquals(token.length, 64);
    assertEquals(store.resolve(token), "user-1");
    assertEquals(store.resolve("user-1"), undefined);
    assertEquals(store.resolve(""), undefined);
});

Deno.test("sessions have unique tokens and preserve account identity", () => {
    const store = new SessionStore();
    const first = store.create("first");
    const second = store.create("second");
    assertNotEquals(first, second);
    assertEquals(store.resolve(first), "first");
    assertEquals(store.resolve(second), "second");
});

Deno.test("sessions expire and cannot be revived by using the token", () => {
    let now = 0;
    const store = new SessionStore(100, () => now);
    const token = store.create("user");
    now = 100;
    assertEquals(store.resolve(token), undefined);
    now = 0;
    assertEquals(store.resolve(token), undefined);
});

Deno.test("logout revokes only the selected session", () => {
    const store = new SessionStore();
    const first = store.create("user");
    const second = store.create("user");
    store.revoke(first);
    assertEquals(store.resolve(first), undefined);
    assertEquals(store.resolve(second), "user");
});
