// Tests für die automatische Terminzuweisung (3.6).
// Lauf: deno test --no-config --no-check common/surveys/schedule-poll/result.test.ts

import { assertEquals } from "jsr:@std/assert@1";
import type { SlotKey, Vote } from "./types.ts";
import {
    computeBestSlot,
    isNegative,
    NEGATIVE,
    optionWeight,
    POSITIVE_MILD,
    POSITIVE_STRONG,
    scoreSlots,
} from "./result.ts";

// Hilfe: Stimme mit gewählten Optionen pro Slot bauen.
const vote = (name: string, slots: Record<string, string>): Vote => ({
    name,
    comments: {},
    slots: Object.fromEntries(
        Object.entries(slots).map(([key, icon]) => [key, { icon, label: icon }]),
    ),
});

// Drei Slots, aufsteigend nach Datum (erster = frühester).
const A = "1000-100-200" as SlotKey;
const B = "2000-100-200" as SlotKey;
const C = "3000-100-200" as SlotKey;

Deno.test("optionWeight: Skala über Emojis", () => {
    assertEquals(optionWeight({ icon: "✅️", label: "passt gut" }), POSITIVE_STRONG);
    assertEquals(optionWeight({ icon: "🤷", label: "passt notfalls" }), POSITIVE_MILD);
    assertEquals(optionWeight({ icon: "❌️", label: "passt nicht" }), NEGATIVE);
    assertEquals(optionWeight({ icon: "🎉", label: "unbekannt" }), POSITIVE_MILD); // gewählt, nicht negativ
    assertEquals(optionWeight(undefined), 0); // nichts gewählt -> neutral
});

Deno.test("isNegative erkennt nur 'passt nicht'", () => {
    assertEquals(isNegative({ icon: "❌️", label: "" }), true);
    assertEquals(isNegative({ icon: "✅️", label: "" }), false);
    assertEquals(isNegative({ icon: "🤷", label: "" }), false);
});

Deno.test("scoreSlots summiert die Gewichte pro Slot", () => {
    const votes = {
        u1: vote("u1", { [A]: "✅️", [B]: "🤷" }),
        u2: vote("u2", { [A]: "✅️", [B]: "❌️" }),
    };
    const scores = scoreSlots([A, B], votes);
    assertEquals(scores[A], 4); // 2 + 2
    assertEquals(scores[B], -1); // 1 + (-2)
});

Deno.test("AK3: klarer Gewinner wird ohne Eingriff bestimmt", () => {
    const votes = {
        u1: vote("u1", { [A]: "🤷", [B]: "✅️" }),
        u2: vote("u2", { [A]: "❌️", [B]: "✅️" }),
    };
    assertEquals(computeBestSlot([A, B], votes), B);
});

Deno.test("AK2: Gewichtung beeinflusst das Ergebnis (nicht nur Stimmenzahl)", () => {
    // Slot A: 2 starke Ja-Stimmen (2+2=4)
    // Slot B: 3 'passt notfalls' (1+1+1=3) -> mehr Leute, aber weniger Gewicht
    const weighted = {
        u1: vote("u1", { [A]: "✅️", [B]: "🤷" }),
        u2: vote("u2", { [A]: "✅️", [B]: "🤷" }),
        u3: vote("u3", { [B]: "🤷" }),
    };
    assertEquals(computeBestSlot([A, B], weighted), A); // Gewicht gewinnt über Kopfzahl

    // Dieselben Leute, aber A nur noch 'notfalls' -> jetzt gewinnt B
    const reweighted = {
        u1: vote("u1", { [A]: "🤷", [B]: "🤷" }),
        u2: vote("u2", { [A]: "🤷", [B]: "🤷" }),
        u3: vote("u3", { [B]: "🤷" }),
    };
    assertEquals(computeBestSlot([A, B], reweighted), B);
});

Deno.test("Gleichstand -> früherer Termin gewinnt", () => {
    const votes = {
        u1: vote("u1", { [B]: "✅️", [C]: "✅️" }),
    };
    // B und C haben beide Score 2 -> B ist früher
    assertEquals(computeBestSlot([B, C], votes), B);
});

Deno.test("keine Slots oder keine Stimmen -> null", () => {
    assertEquals(computeBestSlot([], { u1: vote("u1", { [A]: "✅️" }) }), null);
    assertEquals(computeBestSlot([A, B], {}), null);
});
