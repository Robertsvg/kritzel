import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { createIcsEvent, parseIcsBusyRanges } from "./ics.ts";

Deno.test("calendar export escapes a title instead of injecting properties", () => {
    const content = createIcsEvent("Team, sync; planning\nATTENDEE:other", "20261026T100000", "20261026T110000");
    assertStringIncludes(content, "SUMMARY:Team\\, sync\\; planning\\nATTENDEE:other\r\n");
    assertEquals(content.includes("\r\nATTENDEE:"), false);
    assertStringIncludes(content, "UID:");
    assertStringIncludes(content, "DTSTAMP:");
});

Deno.test("calendar import reads valid UTC ranges", () => {
    const ranges = parseIcsBusyRanges(
        "BEGIN:VEVENT\r\nDTSTART:20261026T100000Z\r\nDTEND:20261026T110000Z\r\nEND:VEVENT",
    );
    assertEquals(ranges.length, 1);
    assertEquals(ranges[0].start.toISOString(), "2026-10-26T10:00:00.000Z");
    assertEquals(ranges[0].end.toISOString(), "2026-10-26T11:00:00.000Z");
});

Deno.test("calendar import ignores incomplete and reversed events", () => {
    const content =
        "BEGIN:VEVENT\nDTSTART:20261026T110000Z\nDTEND:20261026T100000Z\nEND:VEVENT\nBEGIN:VEVENT\nDTSTART:20261026T100000Z\nEND:VEVENT";
    assertEquals(parseIcsBusyRanges(content), []);
});
