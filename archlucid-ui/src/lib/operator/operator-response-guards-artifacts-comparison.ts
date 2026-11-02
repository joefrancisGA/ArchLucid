import { z } from "zod";

import type { ComparisonExplanation } from "@/types/explanation";
import type { ArtifactDescriptor, RunComparison } from "@/types/authority";
import { operatorNonEmptyTrimmedString } from "@/lib/operator/operator-response-guard-scalars";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const artifactDescriptorSchema = z
  .object({
    artifactId: operatorNonEmptyTrimmedString,
    artifactType: z.string(),
    name: z.string(),
    format: operatorNonEmptyTrimmedString,
    createdUtc: z.string(),
    contentHash: operatorNonEmptyTrimmedString,
    manifestId: z.string().optional(),
    runId: z.string().optional(),
  })
  .passthrough();

const artifactListRowSchema = z
  .object({ artifactId: operatorNonEmptyTrimmedString, name: z.string() })
  .passthrough();

/**
 * Ensures artifact list is an array of descriptors with stable ids.
 */
export function coerceArtifactDescriptorList(
  data: unknown,
): { ok: true; items: ArtifactDescriptor[] } | { ok: false; message: string } {
  if (!Array.isArray(data)) {
    return { ok: false, message: "Artifact list was not a JSON array." };
  }

  const parsed = z.array(artifactListRowSchema).safeParse(data);

  if (!parsed.success) {
    return {
      ok: false,
      message: "One or more artifacts are missing artifactId or name.",
    };
  }

  return { ok: true, items: parsed.data as ArtifactDescriptor[] };
}

/**
 * Ensures a single artifact descriptor response matches the UI contract.
 */
export function coerceArtifactDescriptor(
  data: unknown,
): { ok: true; value: ArtifactDescriptor } | { ok: false; message: string } {
  const parsed = artifactDescriptorSchema.safeParse(data);

  if (!parsed.success) {
    if (!isRecord(data)) {
      return { ok: false, message: "Artifact descriptor was not a JSON object." };
    }

    if (!operatorNonEmptyTrimmedString.safeParse(data.artifactId).success) {
      return { ok: false, message: 'Artifact descriptor is missing or invalid "artifactId".' };
    }

    const stringKeys = [
      "artifactType",
      "name",
      "format",
      "createdUtc",
      "contentHash",
    ] as const;

    for (const key of stringKeys) {
      if (typeof data[key] !== "string") {
        return { ok: false, message: `Artifact descriptor is missing or invalid "${key}".` };
      }

      if (
        (key === "format" || key === "contentHash") &&
        !operatorNonEmptyTrimmedString.safeParse(data[key]).success
      ) {
        return { ok: false, message: `Artifact descriptor is missing or invalid "${key}".` };
      }
    }

    if (data.manifestId !== undefined && typeof data.manifestId !== "string") {
      return { ok: false, message: 'Artifact descriptor has invalid "manifestId".' };
    }

    if (data.runId !== undefined && typeof data.runId !== "string") {
      return { ok: false, message: 'Artifact descriptor has invalid "runId".' };
    }

    return { ok: false, message: "Artifact descriptor was not a JSON object." };
  }

  return { ok: true, value: parsed.data as ArtifactDescriptor };
}

const runComparisonSchema = z
  .object({
    leftRunId: operatorNonEmptyTrimmedString,
    rightRunId: operatorNonEmptyTrimmedString,
    runLevelDiffs: z.array(z.unknown()),
    manifestComparison: z
      .object({
        diffs: z.array(z.unknown()),
      })
      .passthrough()
      .optional()
      .nullable(),
  })
  .passthrough();

/**
 * Ensures legacy compare payload is safe to render.
 */
export function coerceRunComparison(
  data: unknown,
): { ok: true; value: RunComparison } | { ok: false; message: string } {
  const parsed = runComparisonSchema.safeParse(data);

  if (!parsed.success) {
    if (!isRecord(data)) {
      return { ok: false, message: "Run comparison response was not a JSON object." };
    }

    if (
      !operatorNonEmptyTrimmedString.safeParse(data.leftRunId).success ||
      !operatorNonEmptyTrimmedString.safeParse(data.rightRunId).success
    ) {
      return { ok: false, message: "Run comparison is missing leftRunId or rightRunId." };
    }

    if (!Array.isArray(data.runLevelDiffs)) {
      return { ok: false, message: 'Run comparison is missing "runLevelDiffs" array.' };
    }

    if (data.manifestComparison != null && data.manifestComparison !== undefined) {
      if (!isRecord(data.manifestComparison)) {
        return { ok: false, message: "manifestComparison is present but not an object." };
      }

      if (!Array.isArray(data.manifestComparison.diffs)) {
        return { ok: false, message: 'manifestComparison is missing "diffs" array.' };
      }
    }

    return { ok: false, message: "Run comparison response was not a JSON object." };
  }

  return { ok: true, value: parsed.data as RunComparison };
}

const comparisonExplanationSchema = z
  .object({
    highLevelSummary: operatorNonEmptyTrimmedString,
    narrative: z.string(),
    majorChanges: z.array(z.unknown()),
    keyTradeoffs: z.array(z.unknown()),
  })
  .passthrough();

/**
 * Ensures AI explanation payload matches the UI sections.
 */
export function coerceComparisonExplanation(
  data: unknown,
): { ok: true; value: ComparisonExplanation } | { ok: false; message: string } {
  const parsed = comparisonExplanationSchema.safeParse(data);

  if (!parsed.success) {
    if (!isRecord(data)) {
      return { ok: false, message: "AI explanation was not a JSON object." };
    }

    if (typeof data.highLevelSummary !== "string" || typeof data.narrative !== "string") {
      return {
        ok: false,
        message: "AI explanation is missing highLevelSummary or narrative strings.",
      };
    }

    if (!operatorNonEmptyTrimmedString.safeParse(data.highLevelSummary).success) {
      return {
        ok: false,
        message: "AI explanation is missing highLevelSummary or narrative strings.",
      };
    }

    if (!Array.isArray(data.majorChanges) || !Array.isArray(data.keyTradeoffs)) {
      return {
        ok: false,
        message: 'AI explanation is missing "majorChanges" or "keyTradeoffs" arrays.',
      };
    }

    return { ok: false, message: "AI explanation was not a JSON object." };
  }

  return { ok: true, value: parsed.data as ComparisonExplanation };
}
