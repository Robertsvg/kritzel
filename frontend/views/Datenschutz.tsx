import { Component, template } from "uix/components/Component.ts";

@template(function () {
    return (
        <main class="legal-page">
            <style>
                {`
            html, body {
                margin: 0;
                background: #ffffff;
            }

            .legal-page {
                --legal-background: #ffffff;
                --legal-text: #111827;
                --legal-text-muted: #4b5563;
                --legal-border: #d1d5db;
                --legal-link: #1d4f91;
                --legal-link-hover: #163d70;

                min-height: 100vh;
                min-height: 100dvh;
                padding: clamp(2rem, 5vw, 4rem) 1.5rem;
                background: var(--legal-background);
                color: var(--legal-text);
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                box-sizing: border-box;
            }

            .legal-page *,
            .legal-page *::before,
            .legal-page *::after { box-sizing: inherit; }

            .legal-shell {
                width: min(100%, 50rem);
                margin: 0 auto;
            }

            .legal-header {
                padding-bottom: 1.5rem;
                margin-bottom: 2rem;
                border-bottom: 1px solid var(--legal-border);
            }

            .legal-header h1 {
                margin: 0;
                font-size: clamp(2rem, 4vw, 2.75rem);
                line-height: 1.15;
                font-weight: 700;
                letter-spacing: -0.02em;
            }

            .legal-intro {
                margin: 0 0 2rem;
                font-size: 1rem;
                line-height: 1.7;
                color: var(--legal-text-muted);
            }

            .legal-section {
                padding-top: 1.5rem;
                border-top: 1px solid var(--legal-border);
            }

            .legal-section + .legal-section {
                margin-top: 1.5rem;
            }

            .legal-section h3 {
                margin: 0 0 0.75rem;
                font-size: 1.125rem;
                line-height: 1.45;
                font-weight: 600;
            }

            .legal-section p {
                margin: 0;
                font-size: 1rem;
                line-height: 1.7;
                color: var(--legal-text-muted);
            }

            .legal-page a {
                color: var(--legal-link);
                text-decoration: underline;
                text-underline-offset: 0.14em;
            }

            .legal-page a:hover,
            .legal-page a:focus-visible {
                color: var(--legal-link-hover);
            }

            .legal-page a:focus-visible {
                outline: 2px solid var(--legal-link);
                outline-offset: 2px;
            }


             .legal-note {
                margin: 2.5rem 0 0;
                padding-top: 1rem;
                border-top: 1px solid var(--legal-border);
                font-size: 0.95rem;
                line-height: 1.6;
                color: var(--legal-text-muted);
            }
        `}
            </style>

            <div class="legal-shell">
                <header class="legal-header">
                    <h1>Datenschutzerklärung</h1>
                </header>

                <p class="legal-intro">
                    Diese Datenschutzerklärung informiert darüber, welche Daten bei der Nutzung von Kritzel verarbeitet
                    werden und zu welchen Zwecken dies geschieht.
                </p>

                <section class="legal-section">
                    <h3>1. Datenerhebung und Accounts</h3>
                    <p>
                        Kritzel kann grundsätzlich ohne Registrierung genutzt werden. Ein Benutzerkonto ist optional und
                        dient ausschließlich dazu, Umfragen und persönliche Einstellungen dauerhaft bereitzustellen.
                    </p>
                </section>

                <section class="legal-section">
                    <h3>2. Nutzung ohne Account</h3>
                    <p>
                        Bei der Nutzung als Gast gilt der Grundsatz der Datensparsamkeit. Es werden keine Anmeldedaten
                        gespeichert. Verarbeitet werden nur die Angaben, die technisch erforderlich sind, um eine
                        Terminabstimmung zu erstellen, durchzuführen oder daran teilzunehmen.
                    </p>
                </section>

                <section class="legal-section">
                    <h3>3. Freiwillige Benutzerkonten</h3>
                    <p>
                        Wenn Nutzer freiwillig ein Benutzerkonto anlegen, speichern wir die dafür erforderlichen
                        Login-Daten: Benutzername und gesalzener Passwort-Hash sowie die IDs verknüpfter Umfragen. Eine
                        E-Mail-Adresse wird nicht abgefragt. Importierte Kalenderdateien werden lokal im Browser
                        ausgewertet und nicht als Kontodaten auf dem Server gespeichert.
                    </p>
                </section>

                <section class="legal-section">
                    <h3>4. Speicherdauer und Löschung</h3>
                    <p>
                        Umfragedaten werden 30 Tage nach Ablauf der jeweiligen Abstimmungsfrist automatisch gelöscht.
                        Kontobezogene Daten bleiben gespeichert, solange ein Benutzerkonto besteht oder bis dessen
                        Löschung veranlasst wird.
                    </p>
                </section>

                <section class="legal-section">
                    <h3>5. Tracking und Drittanbieter</h3>
                    <p>
                        Die App verzichtet vollständig auf Drittanbieter-Tracker. Externe Analyse-, Werbe- oder
                        Profiling-Dienste werden nicht eingesetzt.
                    </p>
                </section>

                <p class="legal-note">
                    Beschreibung der Portfolio-Demonstration. Für einen öffentlichen Betrieb sind die Angaben an den
                    tatsächlichen Betreiber und die eingesetzte Infrastruktur anzupassen.
                </p>
            </div>
        </main>
    );
})
export class Datenschutz extends Component {}
