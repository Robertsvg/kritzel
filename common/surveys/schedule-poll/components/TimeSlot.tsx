import { Component, template } from "uix/components/Component.ts";
import { Time } from "datex-core-legacy/types/time.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";

type Props = {
    start: Ref<Time>;
    end: Ref<Time>;
    onRemove?: () => void;
};

const invalid = localtext({ en: "invalid", de: "ungültig" });
const startTime = localtext({ en: "Start time", de: "Startzeit" });
const endTime = localtext({ en: "End time", de: "Endzeit" });
const removeSlot = localtext({ en: "Remove time slot", de: "Zeitslot entfernen" });

@template(function (props) {
    const isInvalid = always(() => {
        if (!props.start.val || !props.end.val) return true;
        return props.end.val.getTime() - props.start.val.getTime() <= 0;
    });

    const duration = always(() => {
        if (isInvalid.val) return invalid.val;

        const ms = props.end.val.getTime() - props.start.val.getTime();
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            if (minutes > 0) return `${hours}h ${minutes}m`;
            else return `${hours}h`;
        } else return `${minutes}m`;
    });

    return (
        <div class="time-slot">
            <input type="time" value={props.start} aria-label={startTime} />
            <input type="time" value={props.end} aria-label={endTime} />

            <div class={`duration ${isInvalid.val ? "invalid" : ""}`}>
                {duration}
            </div>

            <button type="button" class="remove" onclick={() => props.onRemove?.()} aria-label={removeSlot}>✗</button>
        </div>
    );
})
export class TimeSlot extends Component<Props> {}
