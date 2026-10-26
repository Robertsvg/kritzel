import { Component, template } from "uix/components/Component.ts";

import { LanguageSwitcher } from "common/components/LanguageSwitcher.tsx";
import { ThemeToggle } from "common/components/ThemeToggle.tsx";
import { type Survey } from "common/surveys/surveys.ts";
import { Surveys } from "backend/data.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";

type Props = { surveyId: string };
type RecurringFollowUpStatus = {
    ready: boolean;
    created: boolean;
    id: string;
    administrationToken: string;
};

const notFound = localtext({ en: "This survey could not be found.", de: "Diese Umfrage wurde nicht gefunden." });
const nextRoundTitle = localtext({
    en: "Next recurring round is ready",
    de: "Die nächste wiederkehrende Runde ist bereit",
});
const nextRoundDescription = localtext({
    en: "This poll deadline has passed, so a new round was created automatically.",
    de: "Die Frist ist abgelaufen; daher wurde automatisch eine neue Runde erstellt.",
});
const openNextRound = localtext({ en: "Open next round", de: "Nächste Runde öffnen" });

@template(async function (props) {
    const survey = await Surveys.get(props.surveyId);
    if (typeof survey === "undefined") return <div>{notFound}</div>;

    const surveyDefinition = (await import(`common/surveys/${survey.type}/survey.ts`)).default as Survey<unknown>;
    // Checks for a public next recurring round without exposing an administration token.
    const recurringFollowUp = survey.type === "schedule-poll"
        ? await Surveys.ensureRecurringFollowUp(props.surveyId) as RecurringFollowUpStatus
        : undefined;

    return (
        <>
            <LanguageSwitcher />
            <ThemeToggle />
            <div class="participant-view">
                {recurringFollowUp?.ready && (
                    <div class="recurring-follow-up-notice panel">
                        <div>
                            <div class="title">{nextRoundTitle}</div>
                            <p>{nextRoundDescription}</p>
                        </div>
                        <a href={`/${recurringFollowUp.id}`}>{openNextRound}</a>
                    </div>
                )}
                <div class="participant-component">
                    {new surveyDefinition.participantView({ survey })}
                </div>
            </div>
        </>
    );
})
export class ParticipantView extends Component<Props> {}
