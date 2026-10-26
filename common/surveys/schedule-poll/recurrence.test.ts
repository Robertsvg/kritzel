import { assertEquals, assertThrows } from "jsr:@std/assert@1";

import { createNextRecurringSchedule, isRecurringSchedule } from "./recurrence.ts";
import type { RecurrenceFrequency, Schedule } from "./types.ts";
import type { Time } from "datex-core-legacy/types/time.ts";

const time = (iso: string) => new Date(iso) as unknown as Time;

function recurringSchedule(frequency: RecurrenceFrequency): Schedule {
    return {
        title: "Weekly team sync",
        description: "Find the next recurring slot.",
        voteOptions: [
            { icon: "✅", label: "Yes" },
            { icon: "❌", label: "No" },
        ],
        dates: [
            {
                date: time("2026-06-15T00:00:00.000Z"),
                times: [
                    {
                        start: time("1970-01-01T10:00:00.000Z"),
                        end: time("1970-01-01T11:30:00.000Z"),
                    },
                ],
            },
        ],
        deadline: time("2026-06-14T18:00:00.000Z"),
        recurrence: {
            enabled: true,
            frequency,
        },
    };
}

Deno.test("isRecurringSchedule only accepts enabled recurrence settings", () => {
    assertEquals(isRecurringSchedule(recurringSchedule("weekly")), true);
    assertEquals(isRecurringSchedule({ ...recurringSchedule("weekly"), recurrence: undefined }), false);
    assertEquals(
        isRecurringSchedule({
            ...recurringSchedule("weekly"),
            recurrence: { enabled: false, frequency: "weekly" },
        }),
        false,
    );
});

Deno.test("createNextRecurringSchedule shifts daily rounds by one day", () => {
    const next = createNextRecurringSchedule(recurringSchedule("daily"));

    assertEquals(next.dates[0].date.toISOString(), "2026-06-16T00:00:00.000Z");
    assertEquals(next.deadline?.toISOString(), "2026-06-15T18:00:00.000Z");
});

Deno.test("createNextRecurringSchedule shifts weekly rounds by seven days", () => {
    const next = createNextRecurringSchedule(recurringSchedule("weekly"));

    assertEquals(next.dates[0].date.toISOString(), "2026-06-22T00:00:00.000Z");
    assertEquals(next.deadline?.toISOString(), "2026-06-21T18:00:00.000Z");
});

Deno.test("createNextRecurringSchedule shifts monthly rounds and clamps invalid month days", () => {
    const schedule = recurringSchedule("monthly");
    schedule.dates[0].date = time("2026-01-31T00:00:00.000Z");
    schedule.deadline = time("2026-01-31T18:00:00.000Z");

    const next = createNextRecurringSchedule(schedule);

    assertEquals(next.dates[0].date.toISOString(), "2026-02-28T00:00:00.000Z");
    assertEquals(next.deadline?.toISOString(), "2026-02-28T18:00:00.000Z");
});

Deno.test("createNextRecurringSchedule preserves time slots without sharing references", () => {
    const schedule = recurringSchedule("weekly");
    const next = createNextRecurringSchedule(schedule);

    assertEquals(next.dates[0].times[0].start.toISOString(), "1970-01-01T10:00:00.000Z");
    assertEquals(next.dates[0].times[0].end.toISOString(), "1970-01-01T11:30:00.000Z");
    assertEquals(next.dates[0].times[0] === schedule.dates[0].times[0], false);
    assertEquals(next.voteOptions[0] === schedule.voteOptions[0], false);
});

Deno.test("createNextRecurringSchedule starts without an inherited next round link", () => {
    const schedule = recurringSchedule("weekly");
    schedule.recurrence!.nextSurveyId = "future1";

    const next = createNextRecurringSchedule(schedule);

    assertEquals(next.recurrence?.previousSurveyId, undefined);
    assertEquals(next.recurrence?.nextSurveyId, "");
});

Deno.test("createNextRecurringSchedule rejects non-recurring schedules", () => {
    assertThrows(
        () => createNextRecurringSchedule({ ...recurringSchedule("weekly"), recurrence: undefined }),
        Error,
        "non-recurring schedule",
    );
});
