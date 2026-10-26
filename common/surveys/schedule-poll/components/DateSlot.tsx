import { Component, template } from "uix/components/Component.ts";

import { ScheduleDate, ScheduleTime } from "common/surveys/schedule-poll/types.ts";
import { TimeSlot } from "common/surveys/schedule-poll/components/TimeSlot.tsx";
import { Time } from "datex-core-legacy/types/time.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";
import { UIX } from "uix";

type Props = {
    scheduleDate: ScheduleDate;
};

/**
 * Guesses the time range that is most likely to be chosen based
 * on the pre-existing time slots.
 *
 * At least one time slot is required, otherwise a TypeError will
 * be thrown.
 *
 * @param times
 * @param lastNTimes Only consider the last n time slots for prediction.
 * @throws TypeError if `times` is empty
 */
function predictNextTimeRange(times: ScheduleTime[], lastNTimes = 3) {
    const durations = new Map<number, number>();
    const distances = new Map<number, number>();

    if (times.length === 0) throw new TypeError("At least one time slot is required for prediction.");

    let previousTime: ScheduleTime | undefined = times[times.length - lastNTimes - 1];
    for (const time of times.slice(-lastNTimes)) {
        const duration = time.end.getTime() - time.start.getTime();
        durations.set(duration, durations.get(duration) ?? 0 + 1);

        if (previousTime) {
            const distance = time.start.getTime() - previousTime.end.getTime();
            distances.set(distance, distances.get(distance) ?? 0 + 1);
        }
        previousTime = time;
    }

    const mostCommonDuration = [...durations.entries()].sort((a, b) => b[1] - a[1]).toReversed()[0];
    const mostCommonDistance = [...distances.entries()].sort((a, b) => b[1] - a[1]).toReversed()[0];

    let predictedDuration: number;
    let predictedDistance: number;
    if (mostCommonDuration[1] === 1) {
        predictedDuration = times[times.length - 1].end.getTime() -
            times[times.length - 1].start.getTime();
    } else predictedDuration = mostCommonDuration[0];

    if (times.length < 2) predictedDistance = 0;
    else if (mostCommonDistance[1] === 1) {
        predictedDistance = times[times.length - 1].start.getTime() -
            times[times.length - 2].end.getTime();
    } else predictedDistance = mostCommonDistance[0];

    return {
        start: new Time(times[times.length - 1].end.getTime() + predictedDistance),
        end: new Time(times[times.length - 1].end.getTime() + predictedDistance + predictedDuration),
    } satisfies Pick<ScheduleTime, "start" | "end">;
}

const addTimeSlot = localtext({ en: "Add Time Slot", de: "Zeitslot hinzufügen" });

@template(function (props) {
    return (
        <div class="date-slot">
            <div class="date">{always(() => props.scheduleDate.date.toLocaleDateString(UIX.language))}</div>
            <div class="times">
                {props.scheduleDate.times.map((time, i) => (
                    <TimeSlot
                        start={time.start}
                        end={time.end}
                        onRemove={() => props.scheduleDate.times.splice(i, 1)}
                    />
                ))}
                <button type="button" class="primary" onclick={() => this.addTimeSlot()}>{addTimeSlot}</button>
            </div>
        </div>
    );
})
export class DateSlot extends Component<Props> {
    private addTimeSlot() {
        if (this.properties.scheduleDate.times.length === 0) {
            this.properties.scheduleDate.times.push({
                start: new Time(new Date(Date.UTC(1970, 0, 1, 10, 0))),
                end: new Time(new Date(Date.UTC(1970, 0, 1, 11, 0))),
            });
        } else {
            this.properties.scheduleDate.times.push(
                predictNextTimeRange(this.properties.scheduleDate.times),
            );
        }
    }
}
