import { Component, template } from "uix/components/Component.ts";
import { ParticipantProps } from "common/surveys/surveys.ts";

import { AutoSaveLabel } from "common/components/AutoSaveLabel.tsx";
import { emojiSentiments } from "./static/emoji-sentiments.ts";
import { computeResult } from "./result.ts";
import { formatDuration, Options } from "./survey.ts";
import { ScheduleDate, ScheduleTime, SlotKey, slotKey, Vote } from "./types.ts";
import {
    type CalendarBusyRange,
    createIcsEvent,
    downloadIcsFile,
    parseIcsBusyRanges,
    toIcsDateTime,
} from "common/calendar/ics.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";
import { UIX } from "uix";

const defaultDescription = localtext({
    en: "Please vote for the slots that fit your preferences.",
    de: "Bitte stimme für die Zeitslots ab, die dir passen.",
});
const yourName = localtext({ en: "Your name", de: "Dein Name" });
const nameHint = localtext({ en: "Required for voting", de: "Pflichtfeld zum Abstimmen" });
const optionsHeading = localtext({ en: "Options", de: "Optionen" });
const voteHeading = localtext({ en: "Your vote", de: "Deine Stimme" });
const showVoters = localtext({ en: "Show voters", de: "Teilnehmer einblenden" });
const hideVoters = localtext({ en: "Hide voters", de: "Teilnehmer ausblenden" });
const votePlaceholder = localtext({ en: "Vote", de: "Abstimmen" });
const votingEnded = localtext({ en: "Voting ended:", de: "Abstimmung beendet:" });
const votingUntil = localtext({ en: "Voting open until:", de: "Abstimmung läuft bis:" });
const saveToCalendar = localtext({ en: "Save to calendar", de: "In Kalender speichern" });
const bestSlotLabel = localtext({ en: "Best time", de: "Bester Termin" });
const importCalendar = localtext({ en: "Import calendar:", de: "Kalender importieren:" });
const chooseCalendarFile = localtext({ en: "Choose file", de: "Datei auswählen" });
const noCalendarFile = localtext({ en: "No file chosen", de: "Keine Datei ausgewählt" });
const calendarPrivacyHint = localtext({
    en: "Your calendar file is processed only in your browser. Kritzel uses only busy times to suggest suitable answers.",
    de: "Deine Kalenderdatei wird nur in deinem Browser ausgewertet. Kritzel nutzt daraus nur belegte Zeiten, um passende Antworten vorzuschlagen.",
});
const busyLabel = localtext({ en: "Busy", de: "Belegt" });
const optionalComment = localtext({ en: "Optional comment", de: "Optionaler Kommentar" });
const optionalCommentForSlot = localtext({
    en: "Optional comment for this time slot",
    de: "Optionaler Kommentar für diesen Zeitraum",
});
const commentsLabel = localtext({ en: "Comments", de: "Kommentare" });
const noBestSlot = localtext({ en: "There is no best time yet.", de: "Es gibt noch keinen besten Termin." });
const noNegativeOption = localtext({ en: "No negative voting option was found.", de: "Keine Nein-Option gefunden." });

const MAX_COMMENT_LENGTH = 160;

@template(function (props) {
    const slotVoteCounts = always<Record<string, number>>(() => {
        const counts: Record<SlotKey, number> = {};
        for (const dateSlot of props.survey.configuration.dates) {
            for (const timeSlot of dateSlot.times) {
                const key = slotKey(dateSlot, timeSlot);
                counts[key] = Object.values(props.survey.votes)
                    .filter((vote) =>
                        typeof vote.slots[key] !== "undefined" &&
                        (emojiSentiments as Record<string, number | undefined>)[vote.slots[key].icon] !== -1
                    ).length;
            }
        }
        return counts;
    });
    const isExpired = always(() => {
        const deadline = props.survey.configuration.deadline;
        return deadline ? new Date() > new Date(deadline) : false;
    });
    const highestVoteCount = always(() => Math.max(0, ...Object.values<number>(slotVoteCounts)));

    // Bester Termin (3.6): wird automatisch nach Ablauf der Deadline ermittelt,
    // ohne Eingriff des Initiators (AK3). Liefert den Slot-Key des Gewinners,
    // oder null, wenn die Abstimmung noch läuft oder keine Stimmen vorliegen.
    const bestSlotKey = always(() => {
        if (!isExpired.val) return null;

        const slotKeys: SlotKey[] = [];
        for (const dateSlot of props.survey.configuration.dates) {
            for (const timeSlot of dateSlot.times) {
                slotKeys.push(slotKey(dateSlot, timeSlot));
            }
        }

        return computeResult(slotKeys, props.survey.votes).bestSlot;
    });

    // Gewinner-Slot menschenlesbar formatieren ("Montag, 14. Juli, 18:00 – 19:00").
    const formatBestSlot = (key: SlotKey): string => {
        for (const dateSlot of props.survey.configuration.dates) {
            for (const timeSlot of dateSlot.times) {
                if (slotKey(dateSlot, timeSlot) !== key) continue;
                const date = dateSlot.date.toLocaleDateString(UIX.language, {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                });
                const from = timeSlot.start.toLocaleTimeString(UIX.language, { hour: "2-digit", minute: "2-digit" });
                const to = timeSlot.end.toLocaleTimeString(UIX.language, { hour: "2-digit", minute: "2-digit" });
                return `${date}, ${from} – ${to}`;
            }
        }
        return "";
    };

    return (
        <main>
            <section class="meta panel">
                <h1>{props.survey.configuration.title || "Kritzel"}</h1>
                <p>{always(() => props.survey.configuration.description || defaultDescription.val)}</p>
                {props.survey.configuration.deadline && (
                    <p class={`deadline ${isExpired.val ? "expired" : "active"}`}>
                        {always(() => isExpired.val ? votingEnded.val : votingUntil.val)}{" "}
                        {always(() => new Date(props.survey.configuration.deadline!).toLocaleString(UIX.language))}
                    </p>
                )}
                <AutoSaveLabel />
                <button
                    type="button"
                    class="calendar-export-button"
                    onclick={() => this.exportBestSlot()}
                >
                    {saveToCalendar}
                </button>
            </section>

            {bestSlotKey.val && (
                <section class="result panel">
                    <span class="result-label">{bestSlotLabel}</span>
                    <span class="result-slot">{always(() => formatBestSlot(bestSlotKey.val!))}</span>
                </section>
            )}

            <label class="name panel">
                {yourName}
                <span class="hint">{nameHint}</span>
                <input type="text" value={this.participantName} />
            </label>

            <section class="import-panel panel">
                <strong>{importCalendar}</strong>
                <label class="calendar-file-control">
                    <span class="calendar-file-button">{chooseCalendarFile}</span>
                    <span class="calendar-file-name">
                        {always(() => this.selectedCalendarFileName.val || noCalendarFile.val)}
                    </span>
                    <input
                        type="file"
                        class="calendar-file-input"
                        accept=".ics,text/calendar"
                        onchange={(event) => this.importIcsFile(event)}
                    />
                </label>
                <p class="calendar-privacy-hint">
                    {calendarPrivacyHint}
                </p>
            </section>

            <section class="slots panel">
                <div
                    class="schedule"
                    style={`grid-template-columns: auto 1fr auto auto${
                        this.votersVisible.val ? ` repeat(${Object.keys(props.survey.votes).length}, auto)` : ""
                    }`}
                >
                    <div class="schedule-head">
                        <div class="heading">{optionsHeading}</div>
                        <div class="vote-heading">{voteHeading}</div>
                        <button
                            class="toggle"
                            type="button"
                            aria-pressed={this.votersVisible.val}
                            aria-label={always(() => this.votersVisible.val ? hideVoters.val : showVoters.val)}
                            onclick={() => this.votersVisible.val = !this.votersVisible.val}
                        >
                            {this.votersVisible.val ? "👤 ▲" : "👤 ▼"}
                        </button>
                        {this.votersVisible.val && (
                            <div class="names">
                                {Object.values(props.survey.votes).map((vote) => <div class="voter">{vote.name}</div>)}
                            </div>
                        )}
                    </div>

                    {props.survey.configuration.dates.map((dateSlot) => (
                        <div class="date">
                            <div class="badge" style={`grid-row: span ${dateSlot.times.length}`}>
                                <span class="weekday">
                                    {always(() => dateSlot.date.toLocaleDateString(UIX.language, { weekday: "short" }))}
                                </span>
                                <span class="day">
                                    {always(() => dateSlot.date.toLocaleDateString(UIX.language, { day: "2-digit" }))}
                                </span>
                                <span class="month">
                                    {always(() =>
                                        dateSlot.date.toLocaleDateString(UIX.language, { month: "short" }).toUpperCase()
                                    )}
                                </span>
                            </div>

                            {dateSlot.times.map((timeSlot) => {
                                const key = slotKey(dateSlot, timeSlot);
                                const visibleComments = Object.values(props.survey.votes)
                                    .flatMap((vote) => {
                                        const comment = vote.comments?.[key]?.trim();
                                        if (!comment) return [];

                                        return [{
                                            name: vote.name,
                                            comment,
                                        }];
                                    });

                                if (!(key in this.selectedOptions)) {
                                    this.selectedOptions[key] = "";
                                }

                                if (!(key in this.slotComments)) {
                                    this.slotComments[key] = "";
                                }

                                return (
                                    <div class="slot">
                                        <div class="time">
                                            <span class="range">
                                                {always(() =>
                                                    timeSlot.start.toLocaleTimeString(UIX.language, {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                )}
                                                {" – "}
                                                {always(() =>
                                                    timeSlot.end.toLocaleTimeString(UIX.language, {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                )}
                                            </span>
                                            <span class="duration">
                                                {formatDuration(timeSlot.end.getTime() - timeSlot.start.getTime())}
                                            </span>
                                            {this.isSlotBusy(dateSlot, timeSlot) && (
                                                <span class="busy-label">{busyLabel}</span>
                                            )}
                                        </div>

                                        <div class="choice">
                                            <select
                                                class="vote"
                                                disabled={!this.participantName.val.trim() || isExpired.val}
                                                value={this.selectedOptions[key]}
                                            >
                                                {!this.selectedOptions[key] && (
                                                    <option value="">{votePlaceholder}</option>
                                                )}
                                                {props.survey.configuration.voteOptions.map((option) => (
                                                    <option value={`${option.icon} ${option.label}`}>
                                                        {option.icon} {option.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                class="comment"
                                                type="text"
                                                placeholder={optionalComment}
                                                aria-label={optionalCommentForSlot}
                                                title={optionalCommentForSlot}
                                                disabled={!this.participantName.val.trim() || isExpired.val}
                                                value={this.slotComments[key]}
                                                maxlength={MAX_COMMENT_LENGTH}
                                                onblur={() => this.submitVotes()}
                                            />
                                        </div>

                                        <div
                                            class={`total ${
                                                slotVoteCounts[key] > 0 && slotVoteCounts[key] === highestVoteCount.val
                                                    ? "max"
                                                    : ""
                                            }`}
                                        >
                                            {slotVoteCounts[key]}
                                        </div>

                                        {this.votersVisible.val && (
                                            <div class="votes">
                                                {Object.entries(props.survey.votes).map(([endpointId]) => {
                                                    const selectedOption = props.survey.votes[endpointId]?.slots[key];
                                                    return (
                                                        <div class="response">
                                                            {selectedOption?.icon ?? "–"}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {visibleComments.length > 0 && (
                                            <div class="comments">
                                                <div class="comments-title">{commentsLabel}</div>
                                                {visibleComments.map(({ name, comment }) => (
                                                    <div class="comment-entry">
                                                        <span class="comment-author">{name}:</span>
                                                        <span class="comment-text">{comment}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
})
export default class SchedulePollParticipant extends Component<ParticipantProps<Options, Vote>> {
    votersVisible = $(false);
    participantName = $("");

    /** a `<select>`-friendly representation of the participant's selected options,
     * formatted as `"{icon} {label}"`
     */
    selectedOptions = $<Record<string, string>>({});
    slotComments = $<Record<string, string>>({});

    importedBusyRanges = $<CalendarBusyRange[]>([]);
    selectedCalendarFileName = $("");

    protected override onCreate() {
        if (this.properties.survey.votes[datex.meta.caller.name]?.name !== undefined) {
            this.participantName.val = this.properties.survey.votes[datex.meta.caller.name].name;
        }
        this.updateSelectFriendlyOptionsObject();
        this.updateSlotComments();
        observe(this.properties.survey.votes, () => {
            this.updateSelectFriendlyOptionsObject();
            this.updateSlotComments();
        });
        observe(this.selectedOptions, () => {
            this.submitVotes();
        });
        observe(this.participantName, () => {
            this.submitVotes();
        });
    }

    private updateSelectFriendlyOptionsObject() {
        const submittedSlots = this.properties.survey.votes[datex.meta.caller.name]?.slots ?? {};
        for (const [key, option] of Object.entries(submittedSlots)) {
            if (this.selectedOptions[key] === `${option.icon} ${option.label}`) continue;
            else this.selectedOptions[key] = `${option.icon} ${option.label}`;
        }
    }

    private updateSlotComments() {
        const submittedComments = this.properties.survey.votes[datex.meta.caller.name]?.comments ?? {};

        for (const key of Object.keys(this.slotComments)) {
            if (!(key in submittedComments)) {
                this.slotComments[key] = "";
            }
        }

        for (const [key, comment] of Object.entries(submittedComments)) {
            if (this.slotComments[key] === comment) continue;
            this.slotComments[key] = comment;
        }
    }

    private async submitVotes() {
        if (this.participantName.val.trim() === "") return;

        await this.properties.survey.vote({
            name: this.participantName.val,
            slots: Object.fromEntries(
                Object.entries<string>(this.selectedOptions)
                    .filter(([_, value]) => value !== "")
                    .map(([key, value]) => {
                        const [icon, label] = value.split(" ", 2);
                        return [key, { icon, label }];
                    }),
            ),
            comments: Object.fromEntries(
                Object.entries<string>(this.slotComments)
                    .map(([key, value]) => [key, value.trim().slice(0, MAX_COMMENT_LENGTH)])
                    .filter(([_, value]) => value !== ""),
            ),
        });
    }

    private exportSlot(dateSlot: ScheduleDate, timeSlot: ScheduleTime) {
        const title = this.properties.survey.configuration.title || "Kritzel termin";

        const start = toIcsDateTime(dateSlot.date, timeSlot.start);
        const end = toIcsDateTime(dateSlot.date, timeSlot.end);
        const icsText = createIcsEvent(title, start, end);

        downloadIcsFile("termin.ics", icsText);
    }
    private getBestSlot() {
        const slotKeys: SlotKey[] = [];
        for (const dateSlot of this.properties.survey.configuration.dates) {
            for (const timeSlot of dateSlot.times) {
                slotKeys.push(slotKey(dateSlot, timeSlot));
            }
        }
        const bestSlotKey = computeResult(slotKeys, this.properties.survey.votes).bestSlot;
        if (!bestSlotKey) return null;
        for (const dateSlot of this.properties.survey.configuration.dates) {
            for (const timeSlot of dateSlot.times) {
                if (slotKey(dateSlot, timeSlot) === bestSlotKey) {
                    return { dateSlot, timeSlot };
                }
            }
        }
        return null;
    }
    private exportBestSlot() {
        const bestSlot = this.getBestSlot();
        if (!bestSlot) {
            alert(noBestSlot.val);
            return;
        }

        this.exportSlot(bestSlot.dateSlot, bestSlot.timeSlot);
    }

    private async importIcsFile(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        this.selectedCalendarFileName.val = file.name;
        const content = await file.text();
        const ranges = parseIcsBusyRanges(content);
        this.importedBusyRanges.splice(0, this.importedBusyRanges.length, ...ranges);
        this.applyCalendarAvailability();
    }
    private getSlotStartDate(dateSlot: ScheduleDate, timeSlot: ScheduleTime) {
        return new Date(
            dateSlot.date.getFullYear(),
            dateSlot.date.getMonth(),
            dateSlot.date.getDate(),
            timeSlot.start.getHours(),
            timeSlot.start.getMinutes(),
            0,
        );
    }

    private getSlotEndDate(dateSlot: ScheduleDate, timeSlot: ScheduleTime) {
        return new Date(
            dateSlot.date.getFullYear(),
            dateSlot.date.getMonth(),
            dateSlot.date.getDate(),
            timeSlot.end.getHours(),
            timeSlot.end.getMinutes(),
            0,
        );
    }
    private overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
        return startA < endB && endA > startB;
    }
    private isSlotBusy(dateSlot: ScheduleDate, timeSlot: ScheduleTime) {
        const slotStart = this.getSlotStartDate(dateSlot, timeSlot);
        const slotEnd = this.getSlotEndDate(dateSlot, timeSlot);

        return this.importedBusyRanges.some((range) => this.overlaps(slotStart, slotEnd, range.start, range.end));
    }
    private getNoOption() {
        return this.properties.survey.configuration.voteOptions.find((option) =>
            (emojiSentiments as Record<string, number | undefined>)[option.icon] === -1 ||
            option.label.toLowerCase() === "no" ||
            option.label.toLowerCase() === "nein"
        );
    }
    private applyCalendarAvailability() {
        const noOption = this.getNoOption();

        if (!noOption) {
            alert(noNegativeOption.val);
            return;
        }

        for (const dateSlot of this.properties.survey.configuration.dates) {
            for (const timeSlot of dateSlot.times) {
                if (!this.isSlotBusy(dateSlot, timeSlot)) continue;

                const key = slotKey(dateSlot, timeSlot);
                this.selectedOptions[key] = `${noOption.icon} ${noOption.label}`;
            }
        }
    }
}
