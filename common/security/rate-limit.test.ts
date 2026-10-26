import { assertThrows } from "jsr:@std/assert@1";
import { RateLimiter } from "./rate-limit.ts";

Deno.test("rate limits reject excess attempts and recover after the window", () => {
    let now = 0;
    const limiter = new RateLimiter(() => now);
    const options = { key: "vote:user", limit: 2, windowMs: 100, action: "vote" };
    limiter.assert(options);
    limiter.assert(options);
    assertThrows(() => limiter.assert(options), Error, "Rate limit exceeded");
    now = 100;
    limiter.assert(options);
});

Deno.test("rate limits isolate unrelated users", () => {
    const limiter = new RateLimiter(() => 0);
    limiter.assert({ key: "first", limit: 1, windowMs: 100, action: "vote" });
    assertThrows(() => limiter.assert({ key: "first", limit: 1, windowMs: 100, action: "vote" }), Error);
    limiter.assert({ key: "second", limit: 1, windowMs: 100, action: "vote" });
});

Deno.test("rate limits reject invalid configuration", () => {
    const limiter = new RateLimiter();
    assertThrows(() => limiter.assert({ key: "x", limit: 0, windowMs: 1, action: "vote" }), RangeError);
});
