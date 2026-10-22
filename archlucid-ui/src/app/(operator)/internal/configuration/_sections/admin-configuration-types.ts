import type { components } from "@/lib/openapi-schemas";

export type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];
export type AdminConfigLintFinding = components["schemas"]["AdminConfigLintFinding"];
export type AdminConfigLintResponse = components["schemas"]["AdminConfigLintResponse"];

export type AdminConfigurationLoadState = "idle" | "loading" | "ok" | "forbidden" | "error" | "empty";
