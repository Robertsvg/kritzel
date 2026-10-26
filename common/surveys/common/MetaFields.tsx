import { Component, template } from "uix/components/Component.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";

type Props = {
    title: Ref<string>;
    description: Ref<string>;
};

const titleLabel = localtext({ en: "Title", de: "Titel" });
const titlePlaceholder = localtext({ en: "Name Your Survey", de: "Umfrage benennen" });
const descriptionLabel = localtext({ en: "Description", de: "Beschreibung" });
const descriptionPlaceholder = localtext({ en: "Describe Your Survey", de: "Umfrage beschreiben" });

@template(function (props) {
    return (
        <div class="meta">
            <label>
                {titleLabel}
                <input type="text" class="title" value={props.title} placeholder={titlePlaceholder} />
            </label>
            <label>
                {descriptionLabel}
                <textarea class="description" value={props.description} placeholder={descriptionPlaceholder}></textarea>
            </label>
        </div>
    );
})
export class MetaFields extends Component<Props> {}
