import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import type { AdminConfigLintSummary } from "@/lib/fetch-admin-config-lint";
import { mapConfigLintReadinessForShell, shellHealthReadinessSummary } from "@/lib/buyer/buyer-shell-home-present";
import type { CurrentPrincipal } from "@/lib/current-principal";
import {
  FIRST_PILOT_READINESS_REVIEW_PERMISSIONS_CTA,
  FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,
} from "@/lib/first-pilot-diagnostics-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";
import {
  buildReadinessCloudEvidenceSummary,
  READINESS_AZURE_EXTRACTOR_CTA,
  READINESS_CLOUD_EVIDENCE_LABEL,
} from "@/lib/onboarding-secondary-surfaces";
import type { FirstPilotOperatingRailSignals } from "@/lib/first-pilot-operating-rail-status";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import { applyHomeReadinessRowPresentation } from "@/lib/home-readiness-row-present";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

export type FirstPilotReadinessStatus = "ready" | "attention" | "blocked" | "unknown";

/** Logical section a readiness row belongs to, used to group cards in the cockpit UI. */
export type FirstPilotReadinessGroup = "platform" | "execution" | "evidence" | "followup";

export type FirstPilotReadinessRow = {
  id: string;
  label: string;
  status: FirstPilotReadinessStatus;
  summary: string;
  href: string;
  cta: string;
  group: FirstPilotReadinessGroup;
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
  configLint: AdminConfigLintSummary | null;
}): FirstPilotReadinessRow[] {
  const canExecute = input.principal.authorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const canAdmin = input.principal.authorityRank >= AUTHORITY_RANK.AdminAuthority;
  const baselinesEntered = allBaselinesEntered(input.scorecard);
  const committedRunHref = input.signals.firstCommittedRunId
    ? `/architecture/reviews/${encodeURIComponent(input.signals.firstCommittedRunId)}`
    : "/architecture/reviews";
  const configLintCopy = mapConfigLintReadinessForShell({ canAdmin, lint: input.configLint });

  const rows = applyHomeReadinessRowPresentation([
    {
      id: "api-ready",
      label: "API and platform readiness",
      group: "platform" as const,
      status: statusFromHealth(input.healthStatus, input.healthLoadFailed),
      summary: shellHealthReadinessSummary(input.healthLoadFailed, input.healthStatus),
      href: "/administration/system-health",
      cta: FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,
    },
    {
      id: "config-lint",
      label: "Production-like configuration",
      group: "platform" as const,
      status: configLintCopy.status,
      summary: configLintCopy.summary,
      href: canAdmin ? "/internal/health" : inAppHelpHref("troubleshooting"),
      cta: canAdmin ? "Open config lint" : "Troubleshooting guide",
    },
    {
      id: "storage-and-sql",
      label: "SQL/storage configured",
      group: "platform" as const,
      status: input.signals.setupUnhealthy ? "blocked" : input.signals.setupReady ? "ready" : "attention",
      summary: input.signals.setupReady
        ? "Storage is ready enough for pilot work."
        : "Confirm SQL/storage readiness before relying on persisted reviews.",
      href: "/administration/system-health",
      cta: "Check readiness",
    },
    {
      id: "principal-authority",
      label: "Review authority",
      group: "execution" as const,
      status: input.principal.provenance === "auth-me"
        ? canExecute
          ? "ready"
          : "attention"
        : "unknown",
      summary: canExecute
        ? `${input.principal.maxAuthority} can create and execute the first architecture review.`
        : "Read-only principals can inspect the cockpit and should ask an operator/admin to execute reviews.",
      href: canAdmin ? SETTINGS_USERS_PATH : "/help",
      cta: canAdmin ? "Open roles" : FIRST_PILOT_READINESS_REVIEW_PERMISSIONS_CTA,
    },
    {
      id: "review-pipeline",
      label: "Create, execute, and finalize review",
      group: "execution" as const,
      status: input.signals.hasCommittedManifest
        ? "ready"
        : input.signals.readyToFinalize
          ? "attention"
          : canExecute
            ? "attention"
            : "attention",
      summary: input.signals.hasCommittedManifest
        ? "At least one review is finalized."
        : input.signals.readyToFinalize
          ? "A review appears ready to finalize on review detail."
          : canExecute
            ? "Create or continue the first architecture review."
            : "Read-only role cannot execute or finalize. Ask an operator or admin.",
      href: input.signals.latestRunId ? `/architecture/reviews/${encodeURIComponent(input.signals.latestRunId)}` : "/architecture/reviews/new",
      cta: input.signals.latestRunId ? "Open latest review" : CREATE_ARCHITECTURE_LABEL,
    },
    {
      id: "sample-review",
      label: "Sample review availability",
      group: "execution" as const,
      status: "ready",
      summary: "The curated sample review remains available when real evidence is not ready yet.",
      href: "/see-it",
      cta: "Open sample",
    },
    {
      id: "azure-extractor",
      label: READINESS_CLOUD_EVIDENCE_LABEL,
      group: "execution" as const,
      status: input.signals.evidenceReady ? "ready" : input.runsLoadFailed ? "unknown" : "attention",
      summary: buildReadinessCloudEvidenceSummary(input.signals.evidenceReady, input.runsLoadFailed),
      href: inAppHelpHref("cloud-connections"),
      cta: READINESS_AZURE_EXTRACTOR_CTA,
    },
    {
      id: "roi-baselines",
      label: "ROI baseline readiness",
      group: "evidence" as const,
      status: input.scorecardLoadFailed ? "unknown" : baselinesEntered ? "ready" : canExecute ? "attention" : "attention",
      summary: baselinesEntered
        ? "Sponsor/value outputs can label ROI lines as customer-entered baselines."
        : canExecute
          ? "Capture review hours, reviews per quarter, and loaded architect cost before sponsor export."
          : "ROI baselines are available for review. Editing requires elevated access.",
      href: "/insights/architecture-scorecard#roi-assumptions",
      cta: "Add ROI baseline",
    },
    {
      id: "procurement-classification",
      label: "Procurement evidence readiness",
      group: "evidence" as const,
      status: "attention",
      summary: "Procurement evidence bundle has not been generated yet.",
      href: "/trust",
      cta: "Generate export",
    },
    {
      id: "sponsor-packet",
      label: "Sponsor evidence bundle",
      group: "evidence" as const,
      status: input.signals.hasCommittedManifest ? "ready" : "attention",
      summary: input.signals.hasCommittedManifest
        ? "Sponsor evidence bundle and export surfaces are available from finalized review detail."
        : "Finalize a review before exporting the sponsor evidence bundle.",
      href: committedRunHref,
      cta: "Open evidence bundle",
    },
    {
      id: "proof-pipeline",
      label: "Pilot evidence bundle",
      group: "followup" as const,
      status: input.signals.hasCommittedManifest ? "attention" : "unknown",
      summary: input.signals.hasCommittedManifest
        ? `${FIRST_PILOT_BUYER_COPY.proofPipelineAction} from diagnostics for go/no-go review.`
        : "Finalize a review before collecting the pilot evidence bundle.",
      href: inAppHelpHref("pilot-guide"),
      cta: "Open pilot guide",
    },
    {
      id: "data-consistency",
      label: "Data consistency readiness",
      group: "followup" as const,
      status: mapDataConsistencyStatus({
        healthStatus: input.healthStatus,
        healthLoadFailed: input.healthLoadFailed,
      }),
      summary:
        "Review-readiness status has not been collected yet. Use diagnostics after finalize to refresh readiness — platform health is a coarse signal only.",
      href: "/administration/system-health",
      cta: FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,
    },
    {
      id: "second-review",
      label: "Next review suggestion",
      group: "followup" as const,
      status: input.signals.hasCommittedManifest ? "attention" : "unknown",
      summary: input.signals.hasCommittedManifest
        ? `Next: start a second architecture review with real inputs, compare reviews, try a ${FIRST_PILOT_BUYER_COPY.governanceDryRun}, or generate the sponsor packet.`
        : "Appears after the first finalized review so the first pilot stays focused.",
      href: "/architecture/reviews/new",
      cta: "Start second review",
    },
  ]);

  if (input.signals.hasCommittedManifest) {
    return rows;
  }

  return rows.filter((row) => row.id !== "roi-baselines");
}
