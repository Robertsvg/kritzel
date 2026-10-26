import type { Time } from "datex-core-legacy/types/time.ts";

export function createIcsEvent(title: string, start: string, end: string) {
    const summary = title.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Kritzel//Schedule Poll//EN",
        "BEGIN:VEVENT",
        `UID:${crypto.randomUUID()}@kritzel`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
        `SUMMARY:${summary}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        "END:VEVENT",
        "END:VCALENDAR",
        "",
    ].join("\r\n");
}
function pad(value: number) {
    return String(value).padStart(2, "0");
}

export function toIcsDateTime(date: Time, time: Time) {
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());

    const hour = pad(time.getUTCHours());
    const minute = pad(time.getUTCMinutes());

    return `${year}${month}${day}T${hour}${minute}00`;
}

export function downloadIcsFile(filename: string, content: string) {
    const blob = new Blob([content], {
        type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export type CalendarBusyRange = {
    start: Date;
    end: Date;
};

export function parseIcsBusyRanges(content: string): CalendarBusyRange[] {
    const lines = content
        .replace(/\r?\n[ \t]/g, "")
        .split(/\r?\n/);

    const ranges: CalendarBusyRange[] = [];
    let inEvent = false;
    let start: Date | undefined;
    let end: Date | undefined;

    for (const line of lines) {
        if (line === "BEGIN:VEVENT") {
            inEvent = true;
            start = undefined;
            end = undefined;
            continue;
        }
        if (line === "END:VEVENT") {
            if (start && end && end > start) {
                ranges.push({ start, end });
            }
            inEvent = false;
            continue;
        }
        if (!inEvent) {
            continue;
        }
        const separatorIndex = line.indexOf(":");
        if (separatorIndex === -1) continue;
        const name = line.slice(0, separatorIndex).split(";")[0];
        const value = line.slice(separatorIndex + 1);
        if (name === "DTSTART") start = parseIcsDate(value);
        if (name == "DTEND") end = parseIcsDate(value);
    }
    return ranges;
}

function parseIcsDate(value: string) {
    const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
    if (!match) return undefined;
    const [, year, month, day, hour = "00", minute = "00", second = "00", utc] = match;
    if (utc) {
        return new Date(Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            Number(second),
        ));
    }
    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
    );
}
