import { Entrypoint } from "uix/providers/entrypoints.ts";

import "common/theme.ts";
import "./web-polyfill.ts";

import { cleanupExpiredSurveys } from "../common/surveys/surveys.ts";

cleanupExpiredSurveys();
setInterval(cleanupExpiredSurveys, 1000 * 60 * 60 * 24);

export default {} satisfies Entrypoint;
