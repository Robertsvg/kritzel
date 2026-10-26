import { Time } from "datex-core-legacy/types/time.ts";

/**
 * Returns a deep clone of the given value.
 * Handles primitives, `Date`, `Time`, arrays, and plain objects.
 */
export function deepClone<T>(value: T): T {
    if (value === null || typeof value !== "object") return value;

    if (value instanceof Time) return new Time(value) as T;
    else if (value instanceof Date) return new Date(value) as T;

    if (Array.isArray(value)) {
        const clone: unknown[] = [];
        for (const [index, item] of Object.entries(value)) {
            clone[Number(index)] = deepClone(item);
        }
        return clone as T;
    }

    const clone: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
        clone[key] = deepClone(val);
    }

    return clone as T;
}
