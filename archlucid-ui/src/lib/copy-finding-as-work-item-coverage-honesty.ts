import { typedPayloadLookupString } from "@/lib/findings/finding-display-from-inspect";
import { deriveFindingTrustLabelName } from "@/lib/findings/finding-provenance-display";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import type { FindingWorkItemBuildInput } from "./copy-finding-as-work-item-types";

export type FindingWorkItemProvenanceKind = "asserted" | "inferred";

export type FindingWorkItemCoverageHonesty = {
  readonly line: string;
  readonly provenanceKind?: FindingWorkItemProvenanceKind;
  readonly typedEngineProtected: boolean;
};

const TYPED_ENGINE_CLIPBOARD_LINE =
  "Checklist coverage stays on the package when the insight-density gate demotes a finding." as const;

function readTypedPayloadRecord(payload: FindingInspectPayload | null | undefined): Record<string, unknown> | null {
  const value = payload?.typedPayload;

  if (value === null || value === undefined || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function typedPayloadStringArray(record: Record<string, unknown>, key: string): string[] {
  const raw = record[key];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function typedPayloadIncludesTypedEngineProtected(record: Record<string, unknown> | null): boolean {
  if (record === null) {
    return false;
  }

  const penaltyReasons = typedPayloadStringArray(record, "penaltyReasons");

  if (penaltyReasons.some((reason) => isTypedEnginePenaltyReason(reason))) {
    return true;
  }

  const insightDensityPenaltyReasons = typedPayloadStringArray(record, "insightDensityPenaltyReasons");

  return insightDensityPenaltyReasons.some((reason) => isTypedEnginePenaltyReason(reason));
}

function isTypedEnginePenaltyReason(reason: string): boolean {
  const normalized = reason.trim().toLowerCase();

  return normalized === "typed-engine-scored" || normalized === "typed-engine-protected";
}

function resolveTypedEngineProtected(input: FindingWorkItemBuildInput, payload: FindingInspectPayload | null): boolean {
  const record = readTypedPayloadRecord(payload);

  if (typedPayloadIncludesTypedEngineProtected(record)) {
    return true;
  }

  const trustLabel = deriveFindingTrustLabelName({
    trustLabel: input.trustLabel ?? null,
    policyRuleId: input.decisionRuleId,
    evidenceRefCount: input.evidenceExcerpts.length,
  });

  if (trustLabel === "DeterministicRule" || trustLabel === "DeterministicFallback") {
    return true;
  }

  const engineType = typedPayloadLookupString(payload ?? { typedPayload: null } as FindingInspectPayload, "engineType");

  return engineType !== null && engineType.trim().length > 0;
}

function normalizeProvenanceKind(raw: string | null): FindingWorkItemProvenanceKind | null {
  if (raw === null) {
    return null;
  }

  const normalized = raw.trim().toLowerCase().replace(/[\s_-]+/g, "");

  if (normalized === "asserted" || normalized === "userasserted" || normalized === "humanassertion") {
    return "asserted";
  }

  if (
    normalized === "inferred" ||
    normalized === "modelinferred" ||
    normalized === "aiinference" ||
    normalized === "deterministicinference"
  ) {
    return "inferred";
  }

  return null;
}

function resolveAssertedVsInferredLabel(payload: FindingInspectPayload | null): FindingWorkItemProvenanceKind | null {
  const record = readTypedPayloadRecord(payload);

  if (record === null) {
    return null;
  }

  const explicitKeys = [
    "assertedVsInferred",
    "assertedVsInferredLabel",
    "architectureContentProvenance",
    "contentProvenance",
    "provenanceKind",
    "claimOrigin",
  ] as const;

  for (const key of explicitKeys) {
    const raw = record[key];

    if (typeof raw !== "string") {
      continue;
    }

    const normalized = normalizeProvenanceKind(raw);

    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
}

function formatProvenanceKindLabel(kind: FindingWorkItemProvenanceKind): string {
  if (kind === "asserted") {
    return "Asserted";
  }

  return "Inferred";
}

/** Builds optional clipboard honesty from inspect payload fields — omits rather than guesses (FD-07). */
export function resolveFindingWorkItemCoverageHonesty(
  input: FindingWorkItemBuildInput,
  payload: FindingInspectPayload | null = null,
): FindingWorkItemCoverageHonesty | null {
  const typedEngineProtected = resolveTypedEngineProtected(input, payload);
  const provenanceKind = resolveAssertedVsInferredLabel(payload);
  const segments: string[] = [];

  if (typedEngineProtected) {
    segments.push(TYPED_ENGINE_CLIPBOARD_LINE);
  }

  if (provenanceKind !== null) {
    segments.push(`Finding provenance: ${formatProvenanceKindLabel(provenanceKind)}.`);
  }

  if (segments.length === 0) {
    return null;
  }

  return {
    line: segments.join(" "),
    provenanceKind: provenanceKind ?? undefined,
    typedEngineProtected,
  };
}

export function resolveFindingWorkItemCoverageHonestyFromInput(
  input: FindingWorkItemBuildInput,
): FindingWorkItemCoverageHonesty | null {
  if (input.coverageHonestyLine !== undefined && input.coverageHonestyLine !== null) {
    const trimmed = input.coverageHonestyLine.trim();

    if (trimmed.length > 0) {
      return {
        line: trimmed,
        provenanceKind: input.coverageHonestyProvenanceKind ?? undefined,
        typedEngineProtected: trimmed.toLowerCase().includes("checklist coverage"),
      };
    }
  }

  return null;
}
