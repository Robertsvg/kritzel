import { Component, template } from "uix/components/Component.ts";
import { ALL_SURVEY_TYPES } from "common/surveys/all.ts";
import { Survey } from "common/surveys/surveys.ts";
import { Surveys } from "backend/data.ts";
import { LanguageSwitcher } from "common/components/LanguageSwitcher.tsx";
import { ThemeToggle } from "common/components/ThemeToggle.tsx";
import { AppState } from "frontend/appstate.ts";
import { AuthEndpoint } from "backend/auth.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";

const heading = localtext({ en: "What would you like to create?", de: "Was möchtest du erstellen?" });
const schedulePollLabel = localtext({ en: "Schedule poll", de: "Terminumfrage" });

@template(function () {
    return (
        <>
            <LanguageSwitcher />
            <ThemeToggle />
            <main>
                <h2>{heading}</h2>
                <section>
                    {ALL_SURVEY_TYPES.map(async (typeName) => {
                        const surveyDefinition = (await import(`common/surveys/${typeName}/survey.ts`))
                            .default as Survey<unknown>;
                        const surveyLabel = typeName === "schedule-poll" ? schedulePollLabel : surveyDefinition.label;

                        return (
                            <button
                                class="survey-type"
                                type="button"
                                onclick={async () => {
                                    const { id, administrationToken } = await Surveys.create(typeName);
                                    const sessionToken = AppState.sessionToken.val;
                                    if (sessionToken) {
                                        await AuthEndpoint.linkSurveyToUser(sessionToken, id, administrationToken);
                                    }
                                    window.location.href = `/edit/${id}?token=${administrationToken}`;
                                }}
                            >
                                <img
                                    src={new URL(`../../common/surveys/${typeName}/icon.svg`, import.meta.url).href}
                                    alt={surveyLabel}
                                />
                                <span>{surveyLabel}</span>
                            </button>
                        );
                    })}
                </section>
            </main>
        </>
    );
})
export class CreateSurvey extends Component {}
