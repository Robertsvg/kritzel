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
                width: min(100%, 46rem);
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

            .legal-section + .legal-section {
                margin-top: 2rem;
            }

            .legal-section h2 {
                margin: 0 0 0.75rem;
                font-size: 1.125rem;
                line-height: 1.4;
                font-weight: 600;
            }

            .legal-section p,
            .legal-section li {
                margin: 0;
                font-size: 1rem;
                line-height: 1.7;
                color: var(--legal-text-muted);
            }

            .legal-section address {
                font-style: normal;
            }

            .legal-list {
                margin: 0;
                padding: 0;
                list-style: none;
            }

            .legal-list li + li {
                margin-top: 0.5rem;
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
                    <h1>Impressum</h1>
                </header>

                <section class="legal-section">
                    <h2>Verantwortlich für diesen Dienst</h2>
                    <p>Projektteam Kritzel</p>
                </section>

                <section class="legal-section">
                    <h2>Kontakt</h2>
                    <address>
                        <ul class="legal-list">
                            <li>
                                <a href="https://github.com/Robertsvg/kritzel">Projekt und Kontakt auf GitHub</a>
                            </li>
                        </ul>
                    </address>
                </section>

                <p class="legal-note">
                    Portfolio-Demonstration. Betreiberangaben müssen vor einem öffentlichen Betrieb ergänzt werden.
                </p>
            </div>
        </main>
    );
})
export class Impressum extends Component {}
