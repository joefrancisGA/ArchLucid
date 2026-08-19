/**
 * Two-axis finding provenance for reviewers: origin (who produced it) × grounding
 * (how well evidence supports it). Maps FindingTrustLabel wire/enum names without
 * inventing accuracy claims.
 */

export type FindingTrustLabelName =
  | "EvidenceBacked"
  | "Estimated"
  | "Heuristic"
  | "SimulatorDerived"
  | "RealModel"
  | "Degraded"
  | "MissingCitation"
  | "DeterministicFallback"
  | "DeterministicRule";

export type FindingProvenanceOrigin =
  | "Deterministic rule"
  | "Deterministic fallback"
  | "AI-generated"
  | "Simulated";

export type FindingProvenanceGrounding =
  | "Evidence-backed"
  | "Estimated"
  | "Ungrounded"
  | "Degraded"
  | "Not applicable";

export type FindingProvenanceDisplay = {
  readonly origin: FindingProvenanceOrigin;
  readonly grounding: FindingProvenanceGrounding;
};

export const FINDING_PROVENANCE_ORIGIN_EXPLANATIONS: Record<FindingProvenanceOrigin, string> = {
  "Deterministic rule":
    "A deterministic policy rule fired; the rationale comes from the rule definition, not a model.",
  "Deterministic fallback":
    "The live model path failed; this finding uses a deterministic fallback — verify independently before sign-off.",
  "AI-generated":
    "A language model produced this finding; check the grounding label and linked evidence before signing off.",
  Simulated:
    "Produced by the deterministic simulator, not a live model — do not cite as real-model evidence.",
};

const TRUST_LABEL_NAMES: ReadonlySet<string> = new Set<string>([
  "EvidenceBacked",
  "Estimated",
  "Heuristic",
  "SimulatorDerived",
  "RealModel",
  "Degraded",
  "MissingCitation",
  "DeterministicFallback",
  "DeterministicRule",
]);

/** Normalize API/enum wire forms to the canonical PascalCase label name. */
export function normalizeFindingTrustLabelName(raw: string | null | undefined): FindingTrustLabelName | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (TRUST_LABEL_NAMES.has(trimmed)) {
    return trimmed as FindingTrustLabelName;
  }

  const compact = trimmed.replace(/[\s_-]+/g, "").toLowerCase();

  for (const name of TRUST_LABEL_NAMES) {
    if (name.toLowerCase() === compact) {
      return name as FindingTrustLabelName;
    }
  }

  return null;
}

/** Maps each FindingTrustLabel value to reviewer-facing origin × grounding. */
export function mapFindingTrustLabelToProvenance(label: FindingTrustLabelName): FindingProvenanceDisplay {
  switch (label) {
    case "DeterministicRule":
      return { origin: "Deterministic rule", grounding: "Not applicable" };
    case "DeterministicFallback":
      return { origin: "Deterministic fallback", grounding: "Not applicable" };
    case "RealModel":
      return { origin: "AI-generated", grounding: "Evidence-backed" };
    case "EvidenceBacked":
      return { origin: "AI-generated", grounding: "Evidence-backed" };
    case "Estimated":
      return { origin: "AI-generated", grounding: "Estimated" };
    case "Heuristic":
      return { origin: "AI-generated", grounding: "Ungrounded" };
    case "Degraded":
      return { origin: "AI-generated", grounding: "Degraded" };
    case "SimulatorDerived":
      return { origin: "Simulated", grounding: "Not applicable" };
    case "MissingCitation":
      return { origin: "AI-generated", grounding: "Ungrounded" };
    default: {
      const exhaustive: never = label;

      return exhaustive;
    }
  }
}

export type DeriveFindingTrustLabelInput = {
  readonly trustLabel?: string | null;
  readonly policyRuleId?: string | null;
  readonly evidenceRefCount?: number | null;
  readonly confidenceLevel?: string | null;
  /** When true, the parent review ran in simulator structural mode. */
  readonly isSimulatorRun?: boolean;
};

export type DeriveFindingTrustLabelResult = {
  readonly label: FindingTrustLabelName;
  readonly source: "wire" | "inferred";
};

/**
 * Prefer an explicit trust label from the wire; otherwise infer from fields already on
 * finding rows (policy rule id, evidence count, confidence, run mode).
 *
 * Inference exists only for API responses predating wire `trustLabel` enrichment — remove
 * once all serving paths populate authoritative labels (run detail, inspect, exports).
 */
export function deriveFindingTrustLabelName(input: DeriveFindingTrustLabelInput): FindingTrustLabelName {
  return deriveFindingTrustLabel(input).label;
}

export function deriveFindingTrustLabel(input: DeriveFindingTrustLabelInput): DeriveFindingTrustLabelResult {
  const explicit = normalizeFindingTrustLabelName(input.trustLabel ?? null);

  if (explicit !== null) {
    return { label: explicit, source: "wire" };
  }

  if (input.isSimulatorRun === true) {
    return { label: "SimulatorDerived", source: "inferred" };
  }

  const policyRuleId = (input.policyRuleId ?? "").trim();

  if (policyRuleId.length > 0) {
    return { label: "DeterministicRule", source: "inferred" };
  }

  const evidenceCount = input.evidenceRefCount ?? 0;
  const confidence = (input.confidenceLevel ?? "").trim();

  if (evidenceCount <= 0) {
    if (confidence === "Low") {
      return { label: "Heuristic", source: "inferred" };
    }

    return { label: "MissingCitation", source: "inferred" };
  }

  if (confidence === "Low") {
    return { label: "Estimated", source: "inferred" };
  }

  return { label: "EvidenceBacked", source: "inferred" };
}

export function resolveFindingProvenance(input: DeriveFindingTrustLabelInput): FindingProvenanceDisplay {
  return mapFindingTrustLabelToProvenance(deriveFindingTrustLabelName(input));
}

export type FindingProvenanceAggregateCounts = {
  readonly total: number;
  readonly deterministicRule: number;
  readonly deterministicFallback: number;
  readonly aiGenerated: number;
  readonly aiEvidenceBacked: number;
  readonly simulated: number;
};

export function aggregateFindingProvenance(
  items: readonly DeriveFindingTrustLabelInput[],
): FindingProvenanceAggregateCounts {
  let deterministicRule = 0;
  let deterministicFallback = 0;
  let aiGenerated = 0;
  let aiEvidenceBacked = 0;
  let simulated = 0;

  for (const item of items) {
    const provenance = resolveFindingProvenance(item);

    if (provenance.origin === "Deterministic rule") {
      deterministicRule += 1;
    } else if (provenance.origin === "Deterministic fallback") {
      deterministicFallback += 1;
    } else if (provenance.origin === "Simulated") {
      simulated += 1;
    } else {
      aiGenerated += 1;

      if (provenance.grounding === "Evidence-backed") {
        aiEvidenceBacked += 1;
      }
    }
  }

  return {
    total: items.length,
    deterministicRule,
    deterministicFallback,
    aiGenerated,
    aiEvidenceBacked,
    simulated,
  };
}

/** Quiet scorecard line, e.g. "12 findings — 7 from deterministic rules, 5 AI-generated (4 evidence-backed)". */
export function formatFindingProvenanceAggregateLine(counts: FindingProvenanceAggregateCounts): string | null {
  if (counts.total <= 0) {
    return null;
  }

  const parts: string[] = [];

  if (counts.deterministicRule > 0) {
    parts.push(
      `${counts.deterministicRule} from deterministic rule${counts.deterministicRule === 1 ? "" : "s"}`,
    );
  }

  if (counts.deterministicFallback > 0) {
    parts.push(
      `${counts.deterministicFallback} deterministic fallback${counts.deterministicFallback === 1 ? "" : "s"}`,
    );
  }

  if (counts.aiGenerated > 0) {
    const evidenceSuffix =
      counts.aiEvidenceBacked > 0 ? ` (${counts.aiEvidenceBacked} evidence-backed)` : "";
    parts.push(`${counts.aiGenerated} AI-generated${evidenceSuffix}`);
  }

  if (counts.simulated > 0) {
    parts.push(`${counts.simulated} simulated`);
  }

  if (parts.length === 0) {
    return `${counts.total} finding${counts.total === 1 ? "" : "s"}`;
  }

  return `${counts.total} finding${counts.total === 1 ? "" : "s"} — ${parts.join(", ")}`;
}
