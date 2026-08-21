import { operatorSemanticSurface } from "@/lib/design-tokens";
import { formatProofConfidenceLabel } from "@/lib/proof-confidence-taxonomy";
import { describeSponsorProofReadiness, isAgentOutputPilotStrictSponsorSafe, isProjectedDollarClaimsSponsorSafe, type PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";

export type RunDetailFirstScreenProofDisposition = "READY" | "WARN" | "HOLD";

export type RunDetailFirstScreenProofSummary = {
  readonly disposition: RunDetailFirstScreenProofDisposition;
  readonly cardTitle: string;
  readonly whySafeToSendBullets: readonly string[];
  readonly proofConfidenceLabel: string;
  readonly executionModeLabel: string;
  readonly pilotStrictLabel: string;
  readonly roiBasisLabel: string;
  readonly proofPacketLabel: string;
  readonly governedCoverageLabel: string;
  readonly nextAction: string;
  readonly detail: string;
};

function structuralExecutionModeLabel(payload: PilotRunDeltasProofSummaryJson | null): string {
  const raw = (payload as { structuralExecutionMode?: string | number } | null)?.structuralExecutionMode;

  if (raw === undefined || raw === null || raw === "") {
    return "Unknown";
  }

  return String(raw);
}

function pilotStrictLabel(payload: PilotRunDeltasProofSummaryJson | null): string {
  if (!isAgentOutputPilotStrictSponsorSafe(payload)) {
    return "HOLD — strict sponsor proof not satisfied";
  }

  return "PASS — strict sponsor proof satisfied";
}

function roiBasisLabel(payload: PilotRunDeltasProofSummaryJson | null): string {
  const freshness = (payload as { roiSourceFreshnessDisposition?: string } | null)?.roiSourceFreshnessDisposition;

  if (typeof freshness === "string" && freshness.length > 0) {
    return `${freshness.toUpperCase()} — server ROI freshness status`;
  }

  const sources = (payload as { roiMetricSources?: readonly unknown[] } | null)?.roiMetricSources;

  if (Array.isArray(sources) && sources.length > 0) {
    return "Classified — ROI source catalog present";
  }

  if (isProjectedDollarClaimsSponsorSafe(payload)) {
    return "HOLD — projected dollar claims without source catalog";
  }

  const savings = (payload as { estimatedUsdSavings?: number | null } | null)?.estimatedUsdSavings;

  if (typeof savings === "number" && savings > 0) {
    return "HOLD — estimated savings without source catalog";
  }

  return "Not collected — no unsourced dollar claims";
}

function proofPacketLabel(readiness: ReturnType<typeof describeSponsorProofReadiness>): string {
  if (readiness === null) {
    return "Unknown — proof completeness not returned";
  }

  return `${readiness.title}`;
}

type GovernedCoveragePayload = {
  readonly isAvailable?: boolean;
  readonly governedCount?: number;
  readonly totalDecisionGradeCount?: number;
  readonly governedPercentage?: number | null;
  readonly advisoryCount?: number;
};

function governedCoverageLabel(payload: PilotRunDeltasProofSummaryJson | null): string {
  const coverage = (payload as { governedFindingCoverage?: GovernedCoveragePayload } | null)
    ?.governedFindingCoverage;

  if (!coverage || !coverage.isAvailable) {
    return "Not available";
  }

  const governed = coverage.governedCount ?? 0;
  const total = coverage.totalDecisionGradeCount ?? 0;
  const pct = coverage.governedPercentage;
  const pctLabel = typeof pct === "number" ? `${pct.toFixed(1)}%` : "n/a";

  return `${governed} of ${total} evidence-backed (${pctLabel})`;
}

function buildWhySafeToSendBullets(
  payload: PilotRunDeltasProofSummaryJson | null,
  disposition: RunDetailFirstScreenProofDisposition,
  strictSafe: boolean,
  roiLabel: string,
  simulatorFallback: boolean,
): readonly string[] {
  const bullets: string[] = [];
  const executionMode = structuralExecutionModeLabel(payload);

  if (disposition === "READY") {
    bullets.push(`Execution mode is ${executionMode} with strict AI quality checks satisfied.`);
    bullets.push(roiLabel.startsWith("Classified") ? roiLabel : "No unsourced projected dollar claims detected.");
    bullets.push("Proof packet completeness reports sponsor-sendable posture from server-side labels.");
    bullets.push("Generate the proof-packet folder and keep limitations.md attached for external send.");
    return bullets;
  }

  if (!strictSafe) {
    bullets.push("Strict AI quality evidence is not satisfied for export-ready agent output.");
  }

  if (roiLabel.startsWith("HOLD")) {
    bullets.push(roiLabel);
  }

  if (simulatorFallback) {
    bullets.push("Real mode fell back to simulator for this review — label that limitation before any external send.");
  }

  if (bullets.length === 0) {
    bullets.push("Review proof caveats and resolve HOLD items before sponsor send.");
  }

  return bullets;
}

function buildCardTitle(disposition: RunDetailFirstScreenProofDisposition): string {
  switch (disposition) {
    case "READY":
      return "Why this is safe to send";
    case "WARN":
      return "Why sponsor send needs review";
    case "HOLD":
      return "Why sponsor send is blocked";
    default: {
      const _exhaustive: never = disposition;
      return _exhaustive;
    }
  }
}

export function buildRunDetailFirstScreenProofSummary(
  payload: PilotRunDeltasProofSummaryJson | null,
): RunDetailFirstScreenProofSummary {
  const readiness = describeSponsorProofReadiness(payload);
  const strictSafe = isAgentOutputPilotStrictSponsorSafe(payload);
  const roiLabel = roiBasisLabel(payload);
  const simulatorFallback =
    (payload as { realModeFellBackToSimulator?: boolean } | null)?.realModeFellBackToSimulator === true;

  let disposition: RunDetailFirstScreenProofDisposition = "READY";

  if (
    readiness?.variant === "blocked"
    || !strictSafe
    || roiLabel.startsWith("HOLD")
    || simulatorFallback
    || (payload as { roiSourceFreshnessDisposition?: string } | null)?.roiSourceFreshnessDisposition === "HOLD"
  ) {
    disposition = "HOLD";
  }
  else if (
    readiness?.variant === "caveats"
    || readiness?.variant === "unknown"
    || (payload as { roiSourceFreshnessDisposition?: string } | null)?.roiSourceFreshnessDisposition === "WARN"
  ) {
    disposition = "WARN";
  }

  const nextAction =
    disposition === "READY"
      ? "Generate proof-packet folder and schedule sponsor review."
      : disposition === "WARN"
        ? "Review first-value report caveats before external send."
        : "Resolve proof HOLD items before sponsor send.";

  const detailParts: string[] = [];

  if (simulatorFallback) {
    detailParts.push("Simulator substitution is recorded on this review.");
  }

  if (readiness?.detail) {
    detailParts.push(readiness.detail);
  }

  const extendedPayload = payload as {
    structuralExecutionMode?: string | number;
    realModeFellBackToSimulator?: boolean;
    claimWordingClass?: string;
  } | null;

  return {
    disposition,
    cardTitle: buildCardTitle(disposition),
    whySafeToSendBullets: buildWhySafeToSendBullets(payload, disposition, strictSafe, roiLabel, simulatorFallback),
    proofConfidenceLabel: formatProofConfidenceLabel({
      structuralExecutionMode: extendedPayload?.structuralExecutionMode,
      realModeFellBackToSimulator: extendedPayload?.realModeFellBackToSimulator,
      claimWordingClass: extendedPayload?.claimWordingClass,
    }),
    executionModeLabel: structuralExecutionModeLabel(payload),
    pilotStrictLabel: pilotStrictLabel(payload),
    roiBasisLabel: roiLabel,
    proofPacketLabel: proofPacketLabel(readiness),
    governedCoverageLabel: governedCoverageLabel(payload),
    nextAction,
    detail: detailParts.join(" "),
  };
}

export function runDetailFirstScreenProofDispositionClass(disposition: RunDetailFirstScreenProofDisposition): string {
  switch (disposition) {
    case "READY":
      return operatorSemanticSurface("ready");

    case "WARN":
      return operatorSemanticSurface("warn");

    case "HOLD":
      return operatorSemanticSurface("blocked");

    default: {
      const _exhaustive: never = disposition;

      return _exhaustive;
    }
  }
}

export const RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_HEADING = "Proof status unavailable";

export const RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_BODY =
  "The sponsor proof gate and proof confidence for this review could not be loaded. Until this loads, treat the readiness of this package as unknown and do not rely on it for sponsor handoff.";

export const RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_RETRY_HINT =
  "If retry keeps failing, check execution provenance on the Activity tab.";
