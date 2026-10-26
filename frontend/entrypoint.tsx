import { type Entrypoint } from "uix/providers/entrypoints.ts";

import { ParticipantView } from "frontend/views/ParticipantView.tsx";
import { CreateSurvey } from "frontend/views/CreateSurvey.tsx";
import { Datenschutz } from "frontend/views/Datenschutz.tsx";
import { EditorView } from "frontend/views/EditorView.tsx";
import { Home } from "frontend/views/Home.tsx";
import { Impressum } from "frontend/views/Impressum.tsx";
import { LoginView } from "frontend/views/auth/LoginView.tsx";
import { RegisterView } from "frontend/views/auth/RegisterView.tsx";
import { AppState } from "frontend/appstate.ts";
import { AuthEndpoint } from "backend/auth.ts";

import "common/theme.ts";

export default {
    "/": async () => {
        const token = AppState.sessionToken.val;
        let surveyIds: string[] = [];
        if (token) {
            try {
                surveyIds = await AuthEndpoint.getUserSurveys(token);
            } catch {
                AppState.clearSession();
            }
        }
        return <Home surveyIds={surveyIds} />;
    },
    "/create-survey": <CreateSurvey />,
    "/login": <LoginView />,
    "/register": <RegisterView />,
    "/impressum": <Impressum />,
    "/datenschutz": <Datenschutz />,
    "/edit/:surveyId": (_, { surveyId }) => <EditorView surveyId={surveyId} />,
    "/:surveyId": (_, { surveyId }) => <ParticipantView surveyId={surveyId} />,
} satisfies Entrypoint;
