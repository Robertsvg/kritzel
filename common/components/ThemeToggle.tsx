import { Component, template } from "uix/components/Component.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";

import { currentTheme, type ThemeMode, toggleTheme } from "common/theme.ts";

const lightMode = localtext({ en: "Light mode", de: "Heller Modus" });
const darkMode = localtext({ en: "Dark mode", de: "Dunkler Modus" });
const switchTo = localtext({ en: "Switch to", de: "Wechseln zu" });

// Reactively updates the mode, icon and label.
@template(function () {
    return (
        <button
            class="theme-toggle"
            type="button"
            aria-label={always(() => `${switchTo.val} ${this.nextThemeLabel.val}`)}
            onclick={() => {
                this.theme.val = toggleTheme();
            }}
        >
            <span class="theme-toggle__icon">{this.themeIcon.val}</span>
            <span class="theme-toggle__label">{this.nextThemeLabel.val}</span>
        </button>
    );
})
export class ThemeToggle extends Component {
    theme = $<ThemeMode>(currentTheme());
    themeIcon = always(() => this.theme.val === "dark" ? "☀️" : "🌙");
    nextThemeLabel = always(() => this.theme.val === "dark" ? lightMode.val : darkMode.val);
}
