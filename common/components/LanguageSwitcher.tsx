import { Component, template } from "uix/components/Component.ts";
import { UIX } from "uix";
import { localtext } from "datex-core-legacy/datex_short.ts";

const label = localtext({ en: "Language", de: "Sprache" });

function setLanguage(language: "de" | "en") {
    UIX.language = language;
    if (typeof document !== "undefined") document.documentElement.lang = language;
}

@template(function () {
    return (
        <div class="language-switcher" role="group" aria-label={label}>
            {(["de", "en"] as const).map((lang) => (
                <button
                    type="button"
                    class={UIX.language === lang ? "active" : ""}
                    aria-pressed={UIX.language === lang}
                    onclick={() => setLanguage(lang)}
                >
                    {lang.toUpperCase()}
                </button>
            ))}
        </div>
    );
})
export class LanguageSwitcher extends Component {
    protected override onCreate() {
        if (UIX.language === "de" || UIX.language === "en") setLanguage(UIX.language);
    }
}
