import type { RecurrenceFrequency, Schedule, ScheduleDate, ScheduleTime } from "./types.ts";
import type { Time } from "datex-core-legacy/types/time.ts";

type TimeConstructor = new (value: Date | number | string) => Time;

// Subfeature: monthly edge-case support, e.g. January 31 -> February 28/29.
function daysInUtcMonth(year: number, month: number) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// Subfeature: daily, weekly and monthly date shifting.
function shiftDate(value: Time, frequency: RecurrenceFrequency) {
    const date = new Date(value.getTime());

    if (frequency === "daily") {
        date.setUTCDate(date.getUTCDate() + 1);
    } else if (frequency === "weekly") {
        date.setUTCDate(date.getUTCDate() + 7);
    } else {
        const targetYear = date.getUTCFullYear();
        const targetMonth = date.getUTCMonth() + 1;
        const clampedDay = Math.min(
            date.getUTCDate(),
            daysInUtcMonth(targetYear, targetMonth),
        );

        date.setUTCDate(1);
        date.setUTCMonth(targetMonth);
        date.setUTCDate(clampedDay);
    }

    return new (value.constructor as TimeConstructor)(date);
}

// Subfeature: clone slots so rounds do not share mutable references.
function cloneTimeSlot(timeSlot: ScheduleTime): ScheduleTime {
    return {
        start: new (timeSlot.start.constructor as TimeConstructor)(timeSlot.start.getTime()),
        end: new (timeSlot.end.constructor as TimeConstructor)(timeSlot.end.getTime()),
    };
}

function shiftDateSlot(dateSlot: ScheduleDate, frequency: RecurrenceFrequency): ScheduleDate {
    return {
        date: shiftDate(dateSlot.date, frequency),
        times: dateSlot.times.map(cloneTimeSlot),
    };
}

export function isRecurringSchedule(schedule: Schedule) {
    return schedule.recurrence?.enabled === true;
}

// Subfeature: shift dates/deadline and reset the next-round link.
export function createNextRecurringSchedule(schedule: Schedule): Schedule {
    if (!isRecurringSchedule(schedule) || !schedule.recurrence) {
        throw new Error("Cannot create a recurring round for a non-recurring schedule.");
    }

    const frequency = schedule.recurrence.frequency;

    return {
        ...schedule,
        voteOptions: schedule.voteOptions.map((option) => ({ ...option })),
        dates: schedule.dates.map((dateSlot) => shiftDateSlot(dateSlot, frequency)),
        deadline: schedule.deadline ? shiftDate(schedule.deadline, frequency) : undefined,
        recurrence: {
            ...schedule.recurrence,
            nextSurveyId: "",
        },
    };
}
