import { UIX } from "uix";

UIX.Theme.useTheme("uix-light-plain");

// Subfeature: restrict the application to supported light/dark modes.
export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "kritzel-theme";
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function isThemeMode(value: string | null): value is ThemeMode {
    return value === "light" || value === "dark";
}

// Subfeature: load and validate the persisted browser preference.
function localStorageTheme(): ThemeMode | null {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") return null;

    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : null;
}

function cookieTheme(): ThemeMode | null {
    if (typeof document === "undefined") return null;

    const cookie = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${THEME_STORAGE_KEY}=`));
    const value = cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : null;

    return isThemeMode(value) ? value : null;
}

function storedTheme(): ThemeMode | null {
    return localStorageTheme() ?? cookieTheme();
}

function systemTheme(): ThemeMode {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function currentTheme(): ThemeMode {
    const pageTheme = typeof document === "undefined" ? null : document.documentElement?.dataset.theme ?? null;
    if (isThemeMode(pageTheme)) return pageTheme;

    return storedTheme() ?? systemTheme();
}

// Subfeature: apply the mode and store it for future visits.
export function applyTheme(theme: ThemeMode) {
    if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.dataset.theme = theme;
    }

    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    if (typeof document !== "undefined") {
        document.cookie = `${THEME_STORAGE_KEY}=${
            encodeURIComponent(theme)
        }; max-age=${THEME_COOKIE_MAX_AGE}; path=/; samesite=lax`;
    }
}

// Subfeature: compute and activate the opposite mode.
export function toggleTheme() {
    const nextTheme = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    return nextTheme;
}

applyTheme(storedTheme() ?? systemTheme());
