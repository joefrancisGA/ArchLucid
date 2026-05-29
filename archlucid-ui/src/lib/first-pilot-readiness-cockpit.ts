import type { CurrentPrincipal } from "@/lib/current-principal";
import {
  FIRST_PILOT_READINESS_REVIEW_PERMISSIONS_CTA,
  FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,
} from "@/lib/first-pilot-diagnostics-copy";
import { DEFAULT_GITHUB_BLOB_BASE } from "@/lib/docs-public-base";
import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";import type { FirstPilotOperatingRailSignals } from "@/lib/first-pilot-operating-rail-status";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

export type FirstPilotReadinessStatus = "ready" | "attention" | "blocked" | "unknown";

export type FirstPilotReadinessRow = {
  id: string;
  label: string;
  status: FirstPilotReadinessStatus;
  summary: string;
  href: string;
  cta: string;
};

function statusFromHealth(healthStatus: string | null, healthLoadFailed: boolean): FirstPilotReadinessStatus {
  if (healthLoadFailed)
    return "unknown";

  const normalized = healthStatus?.trim().toLowerCase() ?? "";

  if (normalized.includes("unhealthy") || normalized.includes("down") || normalized.includes("fail"))
    return "blocked";

  if (normalized.includes("healthy") || normalized.includes("degraded") || normalized.includes("warn"))
    return "ready";

  return "attention";
}

function allBaselinesEntered(scorecard: PilotScorecardJson | null): boolean {
  const baselines = scorecard?.baselines;

  return baselines?.baselineHoursPerReview !== null
    && baselines?.baselineHoursPerReview !== undefined
    && baselines?.baselineReviewsPerQuarter !== null
    && baselines?.baselineReviewsPerQuarter !== undefined
    && baselines?.baselineArchitectHourlyCost !== null
    && baselines?.baselineArchitectHourlyCost !== undefined;
}

function mapDataConsistencyStatus(input: {
  healthStatus: string | null;
  healthLoadFailed: boolean;
}): "ready" | "attention" | "blocked" | "unknown" {
  if (input.healthLoadFailed)
    return "unknown";

  const normalized = input.healthStatus?.trim().toLowerCase() ?? "";

  if (normalized.includes("unhealthy") || normalized.includes("down") || normalized.includes("fail"))
    return "blocked";

  return "attention";
}

export function buildFirstPilotReadinessRows(input: {
  healthStatus: string | null;
  healthLoadFailed: boolean;
  runsLoadFailed: boolean;
  principal: CurrentPrincipal;
  signals: FirstPilotOperatingRailSignals;
  scorecard: PilotScorecardJson | null;
  scorecardLoadFailed: boolean;
}): FirstPilotReadinessRow[] {
  const canExecute = input.principal.authorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const canAdmin = input.principal.authorityRank >= AUTHORITY_RANK.AdminAuthority;
  const baselinesEntered = allBaselinesEntered(input.scorecard);
  const committedRunHref = input.signals.firstCommittedRunId
    ? `/reviews/${encodeURIComponent(input.signals.firstCommittedRunId)}`
    : "/reviews?projectId=default";

  return [
    {
      id: "api-ready",
      label: "API and platform readiness",
      status: statusFromHealth(input.healthStatus, input.healthLoadFailed),
      summary: input.healthLoadFailed
        ? "Readiness could not be loaded; open system status to inspect the environment."
        : `Health reports ${input.healthStatus ?? "unknown"}.`,
      href: "/health",
      cta: FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,    },
    {
      id: "principal-authority",
      label: "Review authority",
      status: input.principal.provenance === "auth-me"
        ? canExecute
          ? "ready"
          : "attention"
        : "unknown",
      summary: canExecute
        ? `${input.principal.maxAuthority} can create and execute the first architecture review.`
        : "Read-only principals can inspect the cockpit and should ask an operator/admin to execute reviews.",
      href: canAdmin ? "/settings/roles" : "/help",
      cta: canAdmin ? "Open roles" : FIRST_PILOT_READINESS_REVIEW_PERMISSIONS_CTA,    },
    {
      id: "storage-and-sql",
      label: "SQL/storage configured",
      status: input.signals.setupUnhealthy ? "blocked" : input.signals.setupReady ? "ready" : "attention",
      summary: input.signals.setupReady
        ? "Storage is ready enough for pilot work."
        : "Confirm SQL/storage readiness before relying on persisted reviews.",
      href: "/health",
      cta: "Check readiness",
    },
    {
      id: "sample-review",
      label: "Sample review availability",
      status: "ready",
      summary: "The curated sample package remains available when real evidence is not ready yet.",
      href: "/see-it",
      cta: "Open sample",
    },
    {
      id: "azure-extractor",
      label: "Azure extractor evidence",
      status: input.signals.evidenceReady ? "ready" : input.runsLoadFailed ? "unknown" : "attention",
      summary: input.signals.evidenceReady
        ? "Evidence is attached, acknowledged, or already committed for the pilot path."
        : "Upload an extractor ZIP or use the sample package. No customer-tenant write role is required.",
      href: "/settings/extract-upload",
      cta: "Extract and upload",
    },
    {
      id: "review-pipeline",
      label: "Create, execute, and finalize review",
      status: input.signals.hasCommittedManifest
        ? "ready"
        : input.signals.readyToFinalize
          ? "attention"
          : canExecute
            ? "attention"
            : "attention",
      summary: input.signals.hasCommittedManifest
        ? "At least one review package is finalized."
        : input.signals.readyToFinalize
          ? "A review appears ready to finalize on review detail."
          : canExecute
            ? "Create or continue the first architecture review."
            : "Read-only role cannot execute or finalize. Ask an operator or admin.",      href: input.signals.latestRunId ? `/reviews/${encodeURIComponent(input.signals.latestRunId)}` : "/reviews/new",
      cta: input.signals.latestRunId ? "Open latest review" : "New review",
    },
    {
      id: "roi-baselines",
      label: "ROI baseline readiness",
      status: input.scorecardLoadFailed ? "unknown" : baselinesEntered ? "ready" : canExecute ? "attention" : "attention",
      summary: baselinesEntered
        ? "Sponsor/value outputs can label ROI lines as customer-entered baselines."
        : canExecute
          ? "Capture review hours, reviews per quarter, and loaded architect cost before sponsor export."
          : "ROI baselines are available for review. Editing requires elevated access.",      href: "/scorecard#roi-baselines",
      cta: "Enter ROI baselines",
    },
    {
      id: "procurement-classification",
      label: "Procurement evidence readiness",
      status: "attention",
      summary: "Procurement evidence package has not been generated yet.",
      href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/runbooks/PROCUREMENT_DEAL_READY.md`,
      cta: "Generate procurement package",    },
    {
      id: "proof-pipeline",
      label: "Pilot evidence package",
      status: input.signals.hasCommittedManifest ? "attention" : "unknown",
      summary:
        "After finalize, collect the pilot evidence package from diagnostics for go/no-go review.",
      href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`,
      cta: "Open operator checklist",    },
    {
      id: "data-consistency",
      label: "Data consistency readiness",
      status: mapDataConsistencyStatus({
        healthStatus: input.healthStatus,
        healthLoadFailed: input.healthLoadFailed,
      }),
      summary:
        "Pilot proof status has not been collected yet. Use diagnostics after finalize to refresh readiness — platform health is a coarse signal only.",
      href: "/health",
      cta: FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,    },
    {
      id: "sponsor-packet",
      label: "Executive evidence package",
      status: input.signals.hasCommittedManifest ? "ready" : "attention",
      summary: input.signals.hasCommittedManifest
        ? "Executive evidence package and export surfaces are available from finalized review detail."
        : "Finalize a review package before exporting the executive evidence package.",
      href: committedRunHref,
      cta: "Open evidence package",
    },
    {
      id: "second-review",
      label: "Next review suggestion",
      status: input.signals.hasCommittedManifest ? "attention" : "unknown",
      summary: input.signals.hasCommittedManifest
        ? `Next: start a second architecture review with real inputs, compare reviews, try a ${FIRST_PILOT_BUYER_COPY.governanceDryRun}, or generate the sponsor packet.`
        : "Appears after the first finalized review so the first pilot stays focused.",
      href: "/reviews/new",
      cta: "Start second review",
    },
  ];
}
