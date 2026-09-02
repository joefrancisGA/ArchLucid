import type { components } from "@/lib/openapi-schemas";

export type { LearningProfile } from "@/types/recommendation-learning-operational";

/** Outcome statistics for a single category/urgency/signal-type bucket in a learning profile. */
export type OutcomeStats = components["schemas"]["RecommendationOutcomeStats"];
