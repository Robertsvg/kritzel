import { Component, template } from "uix/components/Component.ts";
import { LanguageSwitcher } from "common/components/LanguageSwitcher.tsx";
import { ThemeToggle } from "common/components/ThemeToggle.tsx";
import { AppState } from "frontend/appstate.ts";
import { AuthEndpoint } from "backend/auth.ts";
import { localtext } from "datex-core-legacy/datex_short.ts";

const placeholder = localtext({ en: "Schedule ID", de: "Termin-ID" });
const openButton = localtext({ en: "Open Schedule", de: "Termin öffnen" });
const orDivider = localtext({ en: "OR", de: "ODER" });
const createButton = localtext({ en: "Create Schedule", de: "Termin erstellen" });
const loggedInAs = localtext({ en: "Logged in as", de: "Eingeloggt als" });
const logout = localtext({ en: "Log out", de: "Ausloggen" });
const login = localtext({ en: "Log in", de: "Anmelden" });
const mySurveysTitle = localtext({ en: "My surveys", de: "Meine Umfragen" });
const surveyLabel = localtext({ en: "Survey", de: "Umfrage" });
const privacyLabel = localtext({ en: "Privacy", de: "Datenschutz" });

@template(function (this: Home, props) {
    return (
        <>
            <LanguageSwitcher />
            <ThemeToggle />
            <main class="home-layout">
                <div class="auth-status-bar">
                    {always(() =>
                        AppState.currentUserId.val
                            ? (
                                <div>
                                    <span>
                                        {loggedInAs} <strong>{AppState.currentUsername.val}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onclick={async () => {
                                            try {
                                                await AuthEndpoint.logout(AppState.sessionToken.val ?? "");
                                            } finally {
                                                AppState.clearSession();
                                                window.location.href = "/";
                                            }
                                        }}
                                    >
                                        {logout}
                                    </button>
                                </div>
                            )
                            : (
                                <div>
                                    <a href="/login">{login}</a>
                                </div>
                            )
                    )}
                </div>

                <h1>Kritzel</h1>

                {always(() =>
                    AppState.currentUserId.val !== null && props.surveyIds.length > 0
                        ? (
                            <section class="panel my-surveys-section">
                                <h2>{mySurveysTitle}</h2>
                                <ul>
                                    {props.surveyIds.map((id) => (
                                        <li>
                                            <a href={`/${id}`}>{surveyLabel}: {id}</a>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )
                        : null
                )}

                <div class="join-by-id">
                    <input type="text" placeholder={placeholder} value={this.surveyId} maxlength={6} />
                    <button
                        class="secondary"
                        type="submit"
                        onclick={() => window.location.href = `/${this.surveyId.val.toLowerCase()}`}
                        disabled={!this.idSubmittable.val}
                    >
                        {openButton}
                    </button>
                </div>

                <div class="or-divider">{orDivider}</div>
                <a href="/create-survey" class="create-survey">
                    <button type="button">{createButton}</button>
                </a>

                <footer class="legal-links">
                    <a href="/impressum">Impressum</a>
                    <a href="/datenschutz">{privacyLabel}</a>
                </footer>
            </main>
        </>
    );
})
export class Home extends Component<{ surveyIds: string[] }> {
    surveyId = $("");
    idSubmittable = always(() => this.surveyId.val.trim().length === 6);
}
