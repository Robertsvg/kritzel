import type { Time } from "datex-core-legacy/types/time.ts";

export type VoteOption = {
    icon: string;
    label: string;
};

export type Vote = {
    name: string;
    slots: Record<SlotKey, VoteOption>;
    comments: Record<SlotKey, string>;
};

// Defines supported intervals and links between previous and next survey rounds.
export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export type RecurrenceSettings = {
    enabled: boolean;
    frequency: RecurrenceFrequency;
    previousSurveyId?: string;
    nextSurveyId?: string;
};

export type Schedule = {
    title: string;
    description: string;
    voteOptions: VoteOption[];
    dates: ScheduleDate[];
    deadline?: Time;
    recurrence?: RecurrenceSettings;
};

export type ScheduleDate = {
    date: Time;
    times: ScheduleTime[];
};

export type ScheduleTime = {
    start: Time;
    end: Time;
};

/** Returns a timezone-safe key unique to the combination of date and time slot */
export const slotKey = (dateSlot: ScheduleDate, timeSlot: ScheduleTime) =>
    `${dateSlot.date.getTime()}-${timeSlot.start.getTime()}-${timeSlot.end.getTime()}` satisfies SlotKey;
export type SlotKey = `${number}-${number}-${number}`;
