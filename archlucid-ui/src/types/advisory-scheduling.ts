import type { components } from "@/lib/openapi-schemas";

/** A cron-based schedule for periodic advisory scans. */
export type AdvisoryScanSchedule = components["schemas"]["AdvisoryScanSchedule"];

/** A single execution of an advisory scan schedule (started, status, result). */
export type AdvisoryScanExecution = components["schemas"]["AdvisoryScanExecution"];

/** A periodic architecture digest (summary report with markdown content). */
export type ArchitectureDigest = components["schemas"]["ArchitectureDigest"];
