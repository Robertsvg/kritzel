import { Component, template } from "uix/components/Component.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";

const label = localtext({ en: "✓ Saves Automatically", de: "✓ Wird automatisch gespeichert" });

@template(function () {
    return <div>{label}</div>;
})
export class AutoSaveLabel extends Component {}
