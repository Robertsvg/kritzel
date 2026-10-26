import type { SlotKey, Vote, VoteOption } from "./types.ts";
import { emojiSentiments } from "./static/emoji-sentiments.ts";

/**
 * Automatische Terminzuweisung (Pflichtenheft 3.6).
 *
 * Reine, framework-freie Logik: arbeitet nur auf Slot-Keys und den abgegebenen
 * Stimmen, kein DATEX/UIX-Import. Dadurch direkt unit-testbar.
 *
 * Gewichtung als Skala über die Emojis der gewählten Option:
 *   "passt gut"     -> +2
 *   "passt notfalls" -> +1
 *   "passt nicht"    -> -2
 */

export const POSITIVE_STRONG = 2;
export const POSITIVE_MILD = 1;
export const NEGATIVE = -2;

/** Bekannte Emojis mit ihrem Gewicht. Negative kommen aus emojiSentiments (-1). */
export const emojiWeights: Record<string, number> = {
    "✅": POSITIVE_STRONG,
    "✅️": POSITIVE_STRONG,
    "👍": POSITIVE_STRONG,
    "💚": POSITIVE_STRONG,
    "🟢": POSITIVE_STRONG,
    "🥳": POSITIVE_STRONG,

    "🤷": POSITIVE_MILD,
    "🤷‍♂️": POSITIVE_MILD,
    "🤷‍♀️": POSITIVE_MILD,
    "😐": POSITIVE_MILD,
    "🟡": POSITIVE_MILD,
    "❓": POSITIVE_MILD,
    "❔": POSITIVE_MILD,
};

/**
 * Gewicht einer einzelnen gewählten Option.
 * - bekanntes Emoji  -> Wert aus emojiWeights
 * - bekannt negativ   -> NEGATIVE
 * - sonst (gewählt, nicht negativ) -> POSITIVE_MILD ("passt")
 * - nichts gewählt    -> 0 (neutral, kein Einfluss)
 */
export function optionWeight(option: VoteOption | undefined): number {
    if (!option) return 0;
    if (option.icon in emojiWeights) return emojiWeights[option.icon];
    if ((emojiSentiments as Record<string, number | undefined>)[option.icon] === -1) return NEGATIVE;
    return POSITIVE_MILD;
}

/** Eine Option gilt als negativ ("passt nicht"), wenn ihr Gewicht negativ ist. */
export function isNegative(option: VoteOption | undefined): boolean {
    return optionWeight(option) < 0;
}

/** Summe der Gewichte aller Stimmen pro Slot. */
export function scoreSlots(
    slotKeys: readonly SlotKey[],
    votes: Record<string, Vote>,
): Record<SlotKey, number> {
    const scores = {} as Record<SlotKey, number>;
    const allVotes = Object.values(votes);
    for (const key of slotKeys) {
        let sum = 0;
        for (const vote of allVotes) sum += optionWeight(vote.slots[key]);
        scores[key] = sum;
    }
    return scores;
}

/** Datums-/Startzeit aus einem Slot-Key (`"{dateMs}-{startMs}-{endMs}"`) für den Tie-Break. */
function slotStart(key: SlotKey): [number, number] {
    const [dateMs, startMs] = key.split("-");
    return [Number(dateMs), Number(startMs)];
}

function earlier(a: SlotKey, b: SlotKey): boolean {
    const [ad, as] = slotStart(a);
    const [bd, bs] = slotStart(b);
    return ad !== bd ? ad < bd : as < bs;
}

/**
 * Der beste Termin: höchste Gewichtssumme. Bei Gleichstand gewinnt der frühere
 * Termin. Gibt `null` zurück, wenn es keine Slots oder keine Stimmen gibt.
 */
export function computeBestSlot(
    slotKeys: readonly SlotKey[],
    votes: Record<string, Vote>,
): SlotKey | null {
    if (slotKeys.length === 0 || Object.keys(votes).length === 0) return null;

    const scores = scoreSlots(slotKeys, votes);
    let best: SlotKey | null = null;
    let bestScore = -Infinity;

    for (const key of slotKeys) {
        const score = scores[key];
        if (score > bestScore || (score === bestScore && best !== null && earlier(key, best))) {
            best = key;
            bestScore = score;
        }
    }
    return best;
}

/** Komfort-Ergebnis für die Anzeige: Gewinner + alle Einzelscores. */
export function computeResult(slotKeys: readonly SlotKey[], votes: Record<string, Vote>) {
    return {
        bestSlot: computeBestSlot(slotKeys, votes),
        scores: scoreSlots(slotKeys, votes),
    };
}
