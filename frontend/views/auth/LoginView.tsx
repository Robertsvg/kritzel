import { Component, template } from "uix/components/Component.ts";
import { AuthEndpoint } from "backend/auth.ts";
import { AppState } from "frontend/appstate.ts";

@template(function () {
    return (
        <main class="panel auth-page">
            <h2 class="auth-title">Anmeldung bei Kritzel</h2>

            {this.errorMessage && (
                <div class="auth-error">
                    {this.errorMessage}
                </div>
            )}

            <label class="auth-field">
                Benutzername
                <input
                    type="text"
                    class="auth-input"
                    value={this.username}
                    placeholder="Dein Benutzername"
                />
            </label>

            <label class="auth-field">
                Passwort
                <input type="password" class="auth-input" value={this.password} placeholder="Dein Passwort" />
            </label>

            <button
                type="button"
                class="vote auth-submit"
                disabled={always(() => !this.username.val.trim() || !this.password.val)}
                onclick={() => this.handleLogin()}
            >
                Einloggen
            </button>

            <p class="auth-switch">
                Noch kein Konto? <a href="/register">Hier registrieren</a>
            </p>
        </main>
    );
})
export class LoginView extends Component {
    username = $("");
    password = $("");
    errorMessage = $("");

    async handleLogin() {
        this.errorMessage.val = "";

        const response = await AuthEndpoint.verifyUserLogin(this.username.val, this.password.val);

        if (response.success && response.userId && response.username && response.sessionToken) {
            AppState.setSession({ id: response.userId, username: response.username, token: response.sessionToken });
            window.location.href = "/";
        } else {
            if (response.error === "Login failed") {
                this.errorMessage.val = "Ungültiger Benutzername oder Passwort.";
            } else {
                this.errorMessage.val = "Ein unerwarteter Fehler ist aufgetreten.";
            }
        }
    }
}
