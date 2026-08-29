import { z } from "zod";

import type { GoldenManifestComparison } from "@/types/comparison";
import type { GraphViewModel } from "@/types/graph";
import type { ManifestSummary, ReplayResponse } from "@/types/authority";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const graphViewModelSchema = z
  .object({
    nodes: z.array(z.unknown()),
    edges: z.array(z.unknown()),
  })
  .passthrough();

/**
 * Ensures graph JSON has nodes and edges arrays (malformed vs empty graph).
 */
export function coerceGraphViewModel(
  data: unknown,
): { ok: true; value: GraphViewModel } | { ok: false; message: string } {
  const parsed = graphViewModelSchema.safeParse(data);

  if (!parsed.success) {
    if (!isRecord(data)) {
      return { ok: false, message: "Graph response was not a JSON object." };
    }

    return {
      ok: false,
      message: 'Graph response is missing "nodes" or "edges" arrays.',
    };
  }

  return { ok: true, value: parsed.data as GraphViewModel };
}

const goldenManifestComparisonSchema = z
  .object({
    decisionChanges: z.array(z.unknown()),
    requirementChanges: z.array(z.unknown()),
    securityChanges: z.array(z.unknown()),
    topologyChanges: z.array(z.unknown()),
    costChanges: z.array(z.unknown()),
    summaryHighlights: z.array(z.unknown()),
    baseRunId: z.string(),
    targetRunId: z.string(),
  })
  .passthrough();

/**
 * Ensures GET api/compare payload has expected section arrays (partial parse failure).
 */
export function coerceGoldenManifestComparison(
  data: unknown,
): { ok: true; value: GoldenManifestComparison } | { ok: false; message: string } {
  const parsed = goldenManifestComparisonSchema.safeParse(data);

  if (!parsed.success) {
    if (!isRecord(data)) {
      return { ok: false, message: "Comparison response was not a JSON object." };
    }

    const needArrays = [
      "decisionChanges",
      "requirementChanges",
      "securityChanges",
      "topologyChanges",
      "costChanges",
      "summaryHighlights",
    ] as const;

    for (const key of needArrays) {
      if (!Array.isArray(data[key])) {
        return {
          ok: false,
          message: `Comparison response is missing or invalid "${key}" array.`,
        };
      }
    }

    if (typeof data.baseRunId !== "string" || typeof data.targetRunId !== "string") {
      return { ok: false, message: "Comparison response is missing baseRunId or targetRunId." };
    }

    return { ok: false, message: "Comparison response was not a JSON object." };
  }

  return { ok: true, value: parsed.data as GoldenManifestComparison };
}

const replayValidationSchema = z
  .object({
    notes: z.array(z.unknown()),
    manifestHashMatches: z.boolean(),
    artifactBundlePresentAfterReplay: z.boolean(),
    hasValidationNotes: z.boolean().optional(),
  })
  .passthrough();

const replayResponseSchema = z
  .object({
    runId: z.string(),
    mode: z.string(),
    replayedUtc: z.string(),
    validation: replayValidationSchema,
  })
  .passthrough();

/**
 * Ensures replay POST body has validation + notes array.
 */
export function coerceReplayResponse(
  data: unknown,
): { ok: true; value: ReplayResponse } | { ok: false; message: string } {
  const parsed = replayResponseSchema.safeParse(data);

  if (!parsed.success) {
    if (!isRecord(data)) {
      return { ok: false, message: "Replay response was not a JSON object." };
    }

    if (typeof data.runId !== "string" || typeof data.mode !== "string" || typeof data.replayedUtc !== "string") {
      return {
        ok: false,
        message: "Replay response is missing runId, mode, or replayedUtc.",
      };
    }

    if (!isRecord(data.validation) || !Array.isArray(data.validation.notes)) {
      return {
        ok: false,
        message: 'Replay response is missing "validation.notes" array.',
      };
    }

    const validation = data.validation;

    const boolKeys = [
      "manifestHashMatches",
      "artifactBundlePresentAfterReplay",
    ] as const;

    for (const key of boolKeys) {
      if (typeof validation[key] !== "boolean") {
        return {
          ok: false,
          message: `Replay validation is missing or invalid "${key}".`,
        };
      }
    }

    if (validation.hasValidationNotes !== undefined && typeof validation.hasValidationNotes !== "boolean") {
      return {
        ok: false,
        message: 'Replay validation has invalid "hasValidationNotes".',
      };
    }

    return { ok: false, message: "Replay response was not a JSON object." };
  }

  return { ok: true, value: parsed.data as ReplayResponse };
}

const manifestSummarySchema = z
  .object({
    manifestId: z.string(),
    runId: z.string(),
    createdUtc: z.string(),
    manifestHash: z.string(),
    ruleSetId: z.string(),
    ruleSetVersion: z.string(),
    status: z.string(),
    decisionCount: z.number(),
    warningCount: z.number(),
    unresolvedIssueCount: z.number(),
    operatorSummary: z.string().optional(),
  })
  .passthrough();

/**
 * Ensures manifest summary has required scalar fields for the review header.
 */
export function coerceManifestSummary(
  data: unknown,
): { ok: true; value: ManifestSummary } | { ok: false; message: string } {
  const parsed = manifestSummarySchema.safeParse(data);

  if (!parsed.success) {
    if (!isRecord(data)) {
      return { ok: false, message: "Review record summary was not a JSON object." };
    }

    const stringKeys = [
      "manifestId",
      "runId",
      "createdUtc",
      "manifestHash",
      "ruleSetId",
      "ruleSetVersion",
      "status",
    ] as const;

    for (const key of stringKeys) {
      if (typeof data[key] !== "string") {
        return { ok: false, message: `Review record summary is missing or invalid "${key}".` };
      }
    }

    const numberKeys = ["decisionCount", "warningCount", "unresolvedIssueCount"] as const;

    for (const key of numberKeys) {
      if (typeof data[key] !== "number") {
        return { ok: false, message: `Review record summary is missing or invalid "${key}".` };
      }
    }

    if (data.operatorSummary !== undefined && typeof data.operatorSummary !== "string") {
      return { ok: false, message: 'Review record summary has invalid "operatorSummary" (expected string).' };
    }

    return { ok: false, message: "Review record summary was not a JSON object." };
  }

  return { ok: true, value: parsed.data as ManifestSummary };
}
