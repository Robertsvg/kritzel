import { Component, template } from "uix/components/Component.ts";
import { AuthEndpoint } from "backend/auth.ts";

@template(function () {
    return (
        <main class="panel auth-page">
            <h2 class="auth-title">Konto erstellen</h2>

            {this.errorMessage && (
                <div class="auth-error">
                    {this.errorMessage}
                </div>
            )}

            {this.successMessage && (
                <div class="auth-success">
                    {this.successMessage}
                </div>
            )}

            <label class="auth-field">
                Benutzername
                <input
                    type="text"
                    class="auth-input"
                    value={this.username}
                    placeholder="Wähle einen Benutzernamen"
                />
            </label>

            <label class="auth-field">
                Passwort
                <input
                    type="password"
                    class="auth-input"
                    value={this.password}
                    placeholder="Mindestens 6 Zeichen"
                />
            </label>

            <button
                type="button"
                class="vote auth-submit"
                disabled={always(() => !this.username.val.trim() || !this.password.val)}
                onclick={() => this.handleRegister()}
            >
                Registrieren
            </button>

            <p class="auth-switch">
                Bereits registriert? <a href="/login">Hier einloggen</a>
            </p>
        </main>
    );
})
export class RegisterView extends Component {
    username = $("");
    password = $("");
    errorMessage = $("");
    successMessage = $("");

    async handleRegister() {
        this.errorMessage.val = "";
        this.successMessage.val = "";

        const response = await AuthEndpoint.registerUser(this.username.val, this.password.val);

        if (response.success) {
            this.successMessage.val = "Konto erfolgreich erstellt! Du wirst zur Anmeldung weitergeleitet...";
            this.username.val = "";
            this.password.val = "";

            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
        } else {
            if (response.error === "Username already exists") {
                this.errorMessage.val = "Dieser Benutzername ist bereits vergeben.";
            } else if (response.error === "Username contains invalid characters") {
                this.errorMessage.val =
                    "Der Benutzername enthält ungültige Zeichen (nur Buchstaben, Zahlen und _ erlaubt).";
            } else if (response.error === "Invalid input length") {
                this.errorMessage.val = "Das Passwort muss mindestens 6 Zeichen lang sein.";
            } else {
                this.errorMessage.val = "Registrierung fehlgeschlagen: " + response.error;
            }
        }
    }
}
