import { Time } from "datex-core-legacy/types/time.ts";
import { Component, template } from "uix/components/Component.ts";

import { MetaFields } from "common/surveys/common/MetaFields.tsx";
import { type EditorProps } from "common/surveys/surveys.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";

import { type Options } from "./survey.ts";
import { RecurrenceFrequency, ScheduleDate, ScheduleTime } from "./types.ts";

import { Calendar } from "./components/Calendar.tsx";
import { DateSlot } from "./components/DateSlot.tsx";
import { VotingOptionsEditor } from "./components/VotingOptionsEditor.tsx";

type RecurringFollowUpStatus = {
    ready: boolean;
    created: boolean;
    id: string;
    administrationToken: string;
};

type SchedulePollEditorProps = EditorProps<Options> & {
    recurringFollowUp?: RecurringFollowUpStatus;
};

const noDates = localtext({
    en: "Begin by selecting a date from the calendar.",
    de: "Beginne damit, ein Datum im Kalender auszuwählen.",
});
const deadlineLabel = localtext({ en: "Deadline", de: "Abstimmungsfrist" });
const recurringSurveyLabel = localtext({ en: "Recurring survey", de: "Wiederkehrende Umfrage" });
const repeatLabel = localtext({ en: "Repeat", de: "Wiederholen" });
const dailyLabel = localtext({ en: "Daily", de: "Täglich" });
const weeklyLabel = localtext({ en: "Weekly", de: "Wöchentlich" });
const monthlyLabel = localtext({ en: "Monthly", de: "Monatlich" });
const openNextRound = localtext({ en: "Open next round", de: "Nächste Runde öffnen" });
const nextRoundReady = localtext({
    en: "The next recurring round is ready with shifted dates and an empty vote list.",
    de: "Die nächste Runde ist mit verschobenen Terminen und einer leeren Stimmenliste bereit.",
});
const nextRoundAfterDeadline = localtext({
    en: "After the deadline, the next recurring round will be created automatically.",
    de: "Nach Ablauf der Frist wird die nächste Runde automatisch erstellt.",
});
const setDeadlineHint = localtext({
    en: "Set a deadline so Kritzel knows when to create the next recurring round.",
    de: "Lege eine Frist fest, damit Kritzel weiß, wann die nächste Runde erstellt werden soll.",
});
const recurrenceHint = localtext({
    en: "When enabled, Kritzel can create the next round automatically after the deadline.",
    de: "Wenn aktiviert, erstellt Kritzel nach Ablauf der Frist automatisch die nächste Runde.",
});

/**
 * Predicts the time schedule most likely to apply to a newly created date slot
 * based on the schedules of existing date slots.
 *
 * The schedule occurring most often is returned. If no schedule occurs more than
 * once, the last date's schedule is returned.
 *
 * @param dates
 * @throws TypeError if `dates` is empty
 */
function predictNextTimeRanges(dates: ScheduleDate[]) {
    if (dates.length === 0) throw new TypeError("At least one date slot is required for prediction.");

    const scheduleKey = (times: ScheduleTime[]) =>
        times.map((time) => `${time.start.getTime()}-${time.end.getTime()}`).join(",");

    const occurrences = new Map<string, number>();
    for (const date of dates) {
        const key = scheduleKey(date.times);
        occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
    }

    const mostCommonSchedule = [...occurrences.entries()].sort((a, b) => a[1] - b[1]).toReversed()[0];

    const targetKey = mostCommonSchedule[1] === 1 ? scheduleKey(dates[dates.length - 1].times) : mostCommonSchedule[0];

    const targetDate = dates.find((date) => scheduleKey(date.times) === targetKey)!;
    return targetDate.times.map(({ start, end }) => ({ start, end })) satisfies Pick<ScheduleTime, "start" | "end">[];
}

function toDateTimeLocalValue(deadline?: Time) {
    if (!deadline) return "";

    const date = new Date(deadline);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60_000);

    return localDate.toISOString().slice(0, 16);
}

const RECURRENCE_OPTIONS = [
    { value: "daily" as RecurrenceFrequency, label: dailyLabel },
    { value: "weekly" as RecurrenceFrequency, label: weeklyLabel },
    { value: "monthly" as RecurrenceFrequency, label: monthlyLabel },
];

function ensureRecurrenceSettings(configuration: Options) {
    configuration.recurrence ??= {
        enabled: false,
        frequency: "weekly",
    };

    return configuration.recurrence;
}

@template(function (props) {
    const selectedDates = $(props.editableConfiguration.dates.map((slot) => slot.date));
    const anyDateSelected = $(selectedDates.length > 0);
    const recurrence = ensureRecurrenceSettings(props.editableConfiguration);
    const recurrenceEnabled = $(recurrence.enabled);
    const deadlineSet = $(Boolean(props.editableConfiguration.deadline));
    observe(selectedDates, () => {
        anyDateSelected.val = selectedDates.length > 0;

        /* Only select dates from the existing configuration that are selected in the calendar */
        let updatedDates = props.editableConfiguration.dates.filter((slot) =>
            selectedDates.some((date) => date.getTime() === slot.date.getTime())
        );

        for (const date of selectedDates) {
            /* If the date is selected in the calendar but not stored in the configuration */
            if (!updatedDates.some((slot) => slot.date.getTime() === date.getTime())) {
                let insertionIndex = updatedDates.findIndex((slot) => slot.date.getTime() > date.getTime());
                if (insertionIndex === -1) insertionIndex = updatedDates.length;

                let times: ScheduleTime[];
                if (updatedDates.length === 0) {
                    times = [{
                        start: new Time(new Date(Date.UTC(1970, 0, 1, 10, 0))),
                        end: new Time(new Date(Date.UTC(1970, 0, 1, 11, 0))),
                    }];
                } else {
                    const SURROUNDING_N_DATES = 3;
                    times = predictNextTimeRanges([
                        ...updatedDates.slice(insertionIndex, insertionIndex + SURROUNDING_N_DATES),
                        ...updatedDates.slice(Math.max(0, insertionIndex - SURROUNDING_N_DATES), insertionIndex),
                    ]).map(({ start, end }) => ({ start, end }));
                }
                updatedDates = [
                    ...updatedDates.slice(0, insertionIndex),
                    { date, times },
                    ...updatedDates.slice(insertionIndex),
                ];
            }
        }

        if (props.editableConfiguration.dates.every((slot, index) => slot === updatedDates[index])) {
            /* Only push newly selected dates to the end */
            for (let i = props.editableConfiguration.dates.length; i < updatedDates.length; i++) {
                props.editableConfiguration.dates.push(updatedDates[i]);
            }
        } else {
            /* Replace all existing dates in-place */
            props.editableConfiguration.dates.splice(
                0,
                props.editableConfiguration.dates.length,
                ...updatedDates,
            );
        }
    });

    return (
        <main>
            <MetaFields
                title={props.editableConfiguration.title}
                description={props.editableConfiguration.description}
            />
            <label>
                {deadlineLabel}
                <input
                    type="datetime-local"
                    value={toDateTimeLocalValue(props.editableConfiguration.deadline)}
                    onchange={(event) => {
                        const value = (event.target as HTMLInputElement).value;
                        props.editableConfiguration.deadline = value ? new Time(new Date(value)) : undefined;
                        deadlineSet.val = Boolean(props.editableConfiguration.deadline);
                    }}
                />
            </label>
            <fieldset class="recurrence-settings">
                <div class="recurrence-heading">
                    <label class="recurrence-toggle">
                        <input
                            type="checkbox"
                            checked={recurrence.enabled}
                            onchange={(event) => {
                                recurrence.enabled = (event.target as HTMLInputElement).checked;
                                recurrenceEnabled.val = recurrence.enabled;
                            }}
                        />
                        <span>{recurringSurveyLabel}</span>
                    </label>
                    {recurrenceEnabled.val && props.recurringFollowUp?.ready && (
                        <a
                            href={`/edit/${props.recurringFollowUp.id}?token=${props.recurringFollowUp.administrationToken}`}
                        >
                            {openNextRound}
                        </a>
                    )}
                </div>
                <label>
                    {repeatLabel}
                    <select
                        disabled={!recurrenceEnabled.val}
                        value={recurrence.frequency}
                        onchange={(event) => {
                            recurrence.frequency = (event.target as HTMLSelectElement).value as RecurrenceFrequency;
                        }}
                    >
                        {RECURRENCE_OPTIONS.map((option) => (
                            <option value={option.value} selected={recurrence.frequency === option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <p>
                    {always(() =>
                        recurrenceEnabled.val
                            ? props.recurringFollowUp?.ready
                                ? nextRoundReady.val
                                : deadlineSet.val
                                ? nextRoundAfterDeadline.val
                                : setDeadlineHint.val
                            : recurrenceHint.val
                    )}
                </p>
            </fieldset>
            <VotingOptionsEditor options={props.editableConfiguration.voteOptions} />
            <div class="schedule-setup">
                <Calendar class="calendar panel" values={selectedDates} />
                <div class="slots panel">
                    {props.editableConfiguration.dates.map((date) => <DateSlot scheduleDate={date} />)}
                    {!anyDateSelected.val && <div class="no-dates">{noDates}</div>}
                </div>
            </div>
        </main>
    );
})
export default class SchedulePollEditor extends Component<SchedulePollEditorProps> {}
