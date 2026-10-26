import { Component, template } from "uix/components/Component.ts";
import { UIX } from "uix";

import { Database } from "../static/emoji-picker-element-1-29-1.js";
import { VoteOption } from "common/surveys/schedule-poll/types.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";

type Props = {
    options: VoteOption[];
};

const title = localtext({ en: "Voting Options", de: "Abstimmungsoptionen" });
const explanation = localtext({
    en: "Customize how participants can vote by setting icons and descriptions",
    de: "Passe an, wie Teilnehmer abstimmen können – mit Icons und Beschreibungen",
});
const labelPlaceholder = localtext({ en: "Label", de: "Bezeichnung" });
const openEmoji = localtext({ en: "Select emoji", de: "Emoji auswählen" });
const removeOption = localtext({ en: "Remove option", de: "Option entfernen" });
const addOption = localtext({ en: "Add Option", de: "Option hinzufügen" });

@template(function (props) {
    const _ = new Database(); /* Otherwise, the <emoji-picker> will not load */

    return (
        <div class="voting-options panel">
            <div class="title">{title}</div>
            <div class="explanation">{explanation}</div>

            <div class="options">
                <uix-fragment>
                    {props.options.map(async (option, index) => {
                        const pickerOpen = $(false);
                        const picker = <emoji-picker class={`${UIX.Theme.mode}`} />;
                        // deno-lint-ignore no-explicit-any
                        picker.addEventListener("emoji-click", (event: any) => {
                            option.icon = event.detail.emoji.unicode;
                            pickerOpen.val = false;
                        });

                        return (
                            <div class="option">
                                <button
                                    type="button"
                                    onclick={() => pickerOpen.val = !pickerOpen.val}
                                    aria-label={openEmoji}
                                    aria-expanded={pickerOpen.val}
                                >
                                    {option.icon}
                                </button>
                                {pickerOpen.val && (
                                    <div
                                        class="emoji-picker-backdrop"
                                        onclick={() => pickerOpen.val = false}
                                    >
                                    </div>
                                )}
                                {pickerOpen.val && picker}
                                <input type="text" value={option.label} placeholder={labelPlaceholder} />
                                <button
                                    type="button"
                                    class="remove"
                                    onclick={() => props.options.splice(index, 1)}
                                    aria-label={removeOption}
                                >
                                    ✗
                                </button>
                            </div>
                        );
                    })}
                </uix-fragment>

                <button type="button" class="add-option" onclick={() => this.addOption()}>{addOption}</button>
            </div>
        </div>
    );
})
export class VotingOptionsEditor extends Component<Props> {
    private addOption() {
        this.properties.options.push({
            label: "",
            icon: "👍️",
        });
    }
}
