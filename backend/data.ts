import { StoredSurvey, type Survey } from "common/surveys/surveys.ts";
import { ALL_SURVEY_TYPES } from "common/surveys/all.ts";
import type { Schedule } from "common/surveys/schedule-poll/types.ts";
import { assertRateLimit } from "common/security/rate-limit.ts";

import { nanoid } from "common/lib/nanoid.js";

type StoredSurveyInstance = ReturnType<typeof StoredSurvey.getById>;
type RecurringFollowUpStatus = {
    ready: boolean;
    created: boolean;
    id: string;
    administrationToken: string;
};

// Creates a unique survey ID and administration token for the next round.
function createSurveyIdentity() {
    let id: string;
    do {
        id = nanoid(6).toLowerCase();
    } while (StoredSurvey.exists(id));

    return {
        id,
        administrationToken: nanoid(),
    };
}

function emptyRecurringFollowUpStatus(): RecurringFollowUpStatus {
    return {
        ready: false,
        created: false,
        id: "",
        administrationToken: "",
    };
}

function getMutableScheduleConfiguration(survey: StoredSurveyInstance) {
    return survey.privateData.configuration as unknown as Schedule;
}

function isAdminToken(survey: StoredSurveyInstance, token?: string) {
    return typeof token === "string" && token.length > 0 && token === survey._administrationToken;
}

// Recurrence starts only after the configured deadline.
function isPastDeadline(configuration: Schedule) {
    if (!configuration.deadline) return false;

    const deadline = typeof configuration.deadline.getTime === "function"
        ? configuration.deadline.getTime()
        : configuration.deadline;

    return new Date(deadline).getTime() <= Date.now();
}

// Creates a fresh survey and links the previous and next rounds.
async function createRecurringFollowUpSurvey(
    survey: StoredSurveyInstance,
    configuration: Schedule,
) {
    const { createNextRecurringSchedule } = await import("common/surveys/schedule-poll/recurrence.ts");

    const nextConfiguration = createNextRecurringSchedule(configuration);
    const nextIdentity = createSurveyIdentity();

    nextConfiguration.recurrence = {
        ...nextConfiguration.recurrence!,
        previousSurveyId: survey.id,
        nextSurveyId: "",
    };

    if (configuration.recurrence) {
        configuration.recurrence.nextSurveyId = nextIdentity.id;
    }

    StoredSurvey.init({
        id: nextIdentity.id,
        type: survey.type,
        configuration: nextConfiguration as unknown as Record<string, unknown>,
        administrationToken: nextIdentity.administrationToken,
    });

    return nextIdentity;
}

// Reuses an already-created next round instead of creating another one.
function getExistingRecurringFollowUp(configuration: Schedule) {
    const nextSurveyId = configuration.recurrence?.nextSurveyId;
    if (!nextSurveyId || !StoredSurvey.exists(nextSurveyId)) return undefined;

    const nextSurvey = StoredSurvey.getById(nextSurveyId);
    return {
        id: nextSurvey.id,
        administrationToken: nextSurvey._administrationToken,
    };
}

@endpoint
export class Surveys {
    @property
    static async create(type: typeof ALL_SURVEY_TYPES[number]) {
        if (!ALL_SURVEY_TYPES.includes(type)) throw new Error("Unknown survey type");
        assertRateLimit({
            key: `create:${datex.meta.caller.name}`,
            limit: 5,
            windowMs: 3_600_000,
            action: "create survey",
        });
        const survey = (await import(`common/surveys/${type}/survey.ts`)).default as Survey<unknown>;

        const { id, administrationToken } = createSurveyIdentity();

        StoredSurvey.init({
            id,
            type,
            configuration: JSON.parse(JSON.stringify(survey.defaultData)),
            administrationToken,
        });

        return { id, administrationToken };
    }

    @property
    static async get(id: string) {
        const survey = StoredSurvey.getById(id);
        return survey;
    }

    @property
    static async createRecurringFollowUp(id: string, administrationToken: string) {
        const survey = StoredSurvey.getById(id);
        if (survey.type !== "schedule-poll") {
            throw new Error("Recurring follow-up rounds are only supported for schedule polls.");
        }

        const configuration = survey.getAdministrativeConfiguration(administrationToken) as Schedule;
        const existingFollowUp = getExistingRecurringFollowUp(configuration);
        if (existingFollowUp) return existingFollowUp;

        return createRecurringFollowUpSurvey(survey, configuration);
    }

    // Used by editor and participant views after the deadline.
    @property
    static async ensureRecurringFollowUp(id: string, administrationToken = "") {
        const { isRecurringSchedule } = await import("common/surveys/schedule-poll/recurrence.ts");
        const survey = StoredSurvey.getById(id);
        if (survey.type !== "schedule-poll") return emptyRecurringFollowUpStatus();

        const configuration = getMutableScheduleConfiguration(survey);
        if (!isRecurringSchedule(configuration) || !isPastDeadline(configuration)) {
            return emptyRecurringFollowUpStatus();
        }

        const existingFollowUp = getExistingRecurringFollowUp(configuration);
        const followUp = existingFollowUp ?? await createRecurringFollowUpSurvey(survey, configuration);
        const canEditNextRound = isAdminToken(survey, administrationToken);

        return {
            ready: true,
            created: typeof existingFollowUp === "undefined",
            id: followUp.id,
            administrationToken: canEditNextRound ? followUp.administrationToken : "",
        };
    }
}
