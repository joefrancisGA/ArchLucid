import { runListPrimaryTitle } from "@/components/operator-home/runs-dashboard-helpers";
import {
  resolveRunFindingCountDisplay,
  resolveRunWarningCountDisplay,
} from "@/lib/operator/operator-home-run-list-insight";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { resolveProductionEvalChromeFromStorage } from "@/lib/resolve-production-eval-chrome-from-storage";
import { formatOperatorProjectIdDisplay } from "@/lib/operator/operator-project-display";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { formatRelativeTime } from "@/lib/relative-time";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

export { runListPrimaryTitle };

export const RUN_LIST_FINDING_COUNT_NOT_STORED_LABEL = "Finding count was not stored." as const;

export const RUN_LIST_WARNING_COUNT_NOT_STORED_LABEL = "Monitored risk count was not stored." as const;

export function runRowNumericCountsLine(run: RunSummary, buyerPolished: boolean): string | null {
  const fc = resolveRunFindingCountDisplay(run);
  const wc = resolveRunWarningCountDisplay(run);
  const ac = run.artifactCount;
  const hasArtifact = typeof ac === "number" && Number.isFinite(ac);

  const tokens: string[] = [];

  if (fc !== null) {
    tokens.push(`${fc} findings`);
  } else {
    tokens.push(RUN_LIST_FINDING_COUNT_NOT_STORED_LABEL);
  }

  if (wc !== null) {
    tokens.push(buyerPolished ? `${wc} monitored risks` : `${wc} warnings`);
  } else {
    tokens.push(RUN_LIST_WARNING_COUNT_NOT_STORED_LABEL);
  }

  if (hasArtifact) {
    tokens.push(`${ac} artifacts`);
  }

  return tokens.join(" · ");
}

export function runRowExplicitCountsLine(run: RunSummary, buyerPolished: boolean): string | null {
  if (isNextPublicDemoMode() && canonicalizeDemoRunId(run.runId) === SHOWCASE_STATIC_DEMO_RUN_ID) {
    const c = SHOWCASE_STATIC_DEMO_SPINE_COUNTS;
    const pkgWord = "Package";

    return `${c.findingCount} findings · ${c.warningCount} ${buyerPolished ? "monitored risks" : "warnings"} · ${pkgWord} ${run.hasGoldenManifest ? "finalized" : "pending"}`;
  }

  const numeric = runRowNumericCountsLine(run, buyerPolished);

  if (numeric !== null) {
    const pkgWord = "Package";

    return `${numeric} · ${pkgWord} ${run.hasGoldenManifest ? "finalized" : "pending"}`;
  }

  return null;
}

export function runRowOutputReadinessLineBuyer(run: RunSummary): string {
  const complete =
    run.hasContextSnapshot === true &&
    run.hasGraphSnapshot === true &&
    run.hasFindingsSnapshot === true &&
    run.hasGoldenManifest === true;

  if (complete) {
    return "All review steps complete";
  }

  const started =
    run.hasContextSnapshot === true ||
    run.hasGraphSnapshot === true ||
    run.hasFindingsSnapshot === true ||
    run.hasGoldenManifest === true;

  if (started) {
    return "Review underway";
  }

  return "Not started";
}

export function runRowOutputReadinessLine(run: RunSummary): string {
  const tokens: string[] = [];

  if (run.hasFindingsSnapshot) {
    tokens.push("Findings captured");
  }

  if (run.hasGoldenManifest) {
    tokens.push("Review finalized");
  }

  if (run.hasArtifactBundle) {
    tokens.push("Artifacts bundled");
  }

  const reviewTrailSummary =
    run.hasContextSnapshot === true &&
    run.hasGraphSnapshot === true &&
    run.hasFindingsSnapshot === true &&
    run.hasGoldenManifest === true
      ? "Review trail complete"
      : run.hasContextSnapshot === true ||
          run.hasGraphSnapshot === true ||
          run.hasFindingsSnapshot === true ||
          run.hasGoldenManifest === true
        ? "Review trail partial"
        : "Review trail: not started";

  if (tokens.length === 0) {
    return `Output: in progress · ${reviewTrailSummary}`;
  }

  return `${tokens.join(" · ")} · ${reviewTrailSummary}`;
}

export function runRowAccessibleDescription(
  run: RunSummary,
  activeProjectId: string,
  countsLine: string | null,
  buyerPolished: boolean,
): string {
  const title = runListPrimaryTitle(run);
  const created = new Date(run.createdUtc).toLocaleString();
  const counts = countsLine !== null ? `${countsLine}. ` : "";
  const readiness = buyerPolished ? runRowOutputReadinessLineBuyer(run) : runRowOutputReadinessLine(run);
  const projectNote =
    run.projectId === activeProjectId
      ? ""
      : `Project ${formatOperatorProjectIdDisplay(run.projectId)}. `;

  return `${title}. ${projectNote}${counts}Created ${created}. ${readiness}. Press Enter or Space to open the review preview panel.`;
}

export function inspectorTitle(run: RunSummary | null): string {
  if (run === null) {
    return "Review preview";
  }

  if (resolveProductionEvalChromeFromStorage()) {
    return "Review summary";
  }

  return runListPrimaryTitle(run);
}

export function displayRelativeCreated(run: RunSummary): string {
  if (
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    canonicalizeDemoRunId(run.runId) === SHOWCASE_STATIC_DEMO_RUN_ID
  ) {
    return new Date(run.createdUtc).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return formatRelativeTime(run.createdUtc);
}
