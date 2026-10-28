import { runListPrimaryTitle } from "@/components/operator-home/runs-dashboard-helpers";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { resolveProductionEvalChromeFromStorage } from "@/lib/resolve-production-eval-chrome-from-storage";
import { formatOperatorProjectIdDisplay } from "@/lib/operator/operator-project-display";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import { formatRelativeTime } from "@/lib/relative-time";

export const RUN_CREATED_TIME_NOT_STORED_COPY = "Created time was not stored." as const;
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

export { runListPrimaryTitle };

export const FINDINGS_SNAPSHOT_FLAG_NOT_STORED_LABEL = "Findings snapshot flag was not stored." as const;

export const RUN_LIST_FINDING_COUNT_NOT_STORED_LABEL = "Finding count was not stored." as const;

export const RUN_LIST_WARNING_COUNT_NOT_STORED_LABEL = "Warning count was not stored." as const;

export const RUN_LIST_ARTIFACT_COUNT_NOT_STORED_LABEL = "Artifact count was not stored." as const;

export function runRowNumericCountsLine(run: RunSummary, buyerPolished: boolean): string | null {
  const fc = run.findingCount;
  const wc = run.warningCount;
  const ac = run.artifactCount;
  const hasFinding = typeof fc === "number" && Number.isFinite(fc);
  const hasWarning = typeof wc === "number" && Number.isFinite(wc);
  const hasArtifact = typeof ac === "number" && Number.isFinite(ac);
  const findingOmitted = fc === null || fc === undefined;
  const warningOmitted = wc === null || wc === undefined;
  const artifactOmitted = ac === null || ac === undefined;

  if (!hasFinding && !hasWarning && !hasArtifact && !findingOmitted && !warningOmitted && !artifactOmitted) {
    return null;
  }

  const tokens: string[] = [];

  if (hasFinding) {
    tokens.push(`${fc} findings`);
  } else if (findingOmitted) {
    tokens.push(RUN_LIST_FINDING_COUNT_NOT_STORED_LABEL);
  }

  if (hasWarning) {
    tokens.push(buyerPolished ? `${wc} monitored risks` : `${wc} warnings`);
  } else if (warningOmitted) {
    tokens.push(RUN_LIST_WARNING_COUNT_NOT_STORED_LABEL);
  }

  if (hasArtifact) {
    tokens.push(`${ac} artifacts`);
  } else if (artifactOmitted) {
    tokens.push(RUN_LIST_ARTIFACT_COUNT_NOT_STORED_LABEL);
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
    const packageSealSuffix =
      run.hasGoldenManifest === true
        ? "Package finalized"
        : run.hasGoldenManifest === false
          ? "Package pending"
          : null;

    return packageSealSuffix !== null ? `${numeric} · ${packageSealSuffix}` : numeric;
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

  if (run.hasFindingsSnapshot === undefined) {
    return FINDINGS_SNAPSHOT_FLAG_NOT_STORED_LABEL;
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
      : run.hasFindingsSnapshot === undefined
        ? FINDINGS_SNAPSHOT_FLAG_NOT_STORED_LABEL
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
  const createdUtc = run.createdUtc?.trim() ?? "";
  const createdMs = parseIsoUtcMs(createdUtc);
  const created =
    createdUtc.length === 0 || Number.isNaN(createdMs)
      ? RUN_CREATED_TIME_NOT_STORED_COPY
      : new Date(createdMs).toLocaleString(undefined, { timeZone: "UTC" }) + " UTC";
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
  const createdUtc = run.createdUtc?.trim() ?? "";

  if (createdUtc.length === 0) {
    return RUN_CREATED_TIME_NOT_STORED_COPY;
  }

  if (Number.isNaN(parseIsoUtcMs(createdUtc))) {
    return RUN_CREATED_TIME_NOT_STORED_COPY;
  }

  if (
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    canonicalizeDemoRunId(run.runId) === SHOWCASE_STATIC_DEMO_RUN_ID
  ) {
    return new Date(createdUtc).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return formatRelativeTime(createdUtc);
}
