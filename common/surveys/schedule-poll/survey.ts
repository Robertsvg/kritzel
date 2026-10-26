import { Survey } from "common/surveys/surveys.ts";

import EditorView from "./Editor.tsx";
import ParticipantView from "./Participant.tsx";
import { Schedule } from "./types.ts";

export type Options = Schedule;

/**
 * Formats a duration in milliseconds into a human-readable string.
 * If the duration is less than or equal to 0, this function returns `"invalid"`.
 */
export function formatDuration(milliseconds: number) {
    if (milliseconds <= 0) return "invalid";

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
        if (minutes > 0) return `${hours}h ${minutes}m`;
        else return `${hours}h`;
    } else return `${minutes}m`;
}

export default {
    label: "Terminumfrage",

    defaultData: {
        title: "",
        description: "",
        voteOptions: [
            { icon: "✅️", label: "Ja" },
            { icon: "❌️", label: "Nein" },
        ],
        dates: [],
        deadline: undefined,
        // Opt-in behaviour with a safe weekly default and no linked rounds.
        recurrence: {
            enabled: false,
            frequency: "weekly",
            previousSurveyId: "",
            nextSurveyId: "",
        },
    },

    editorView: EditorView,
    participantView: ParticipantView,
} satisfies Survey<Options>;
