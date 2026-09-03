import type { components } from "@/lib/openapi-schemas";

/** `GET /v1/pilots/scorecard` in-product scorecard JSON — OpenAPI `PilotInProductScorecardResponse`. */
export type PilotScorecardJson = components["schemas"]["PilotInProductScorecardResponse"];

/** Trailing-window outcome rollup (`GET /v1/pilots/outcome-summary`). */
export type PilotScorecardResponse = components["schemas"]["PilotScorecardResponse"];
