import { getShowcaseSponsorHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { buildReadOnlyReviewWorkspaceHref } from "@/lib/read-only-review-workspace-href";
import {
  SHOWCASE_BUYER_REVIEW_TITLE,
  SHOWCASE_STATIC_DEMO_ILLUSTRATIVE_ANNUALIZED_EXTRACTION_USD,
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";

export type CtoDemoRecapPayload = {
  readonly systemName: string;
  readonly findingsCount: number;
  readonly criticalCount: number;
  readonly riskPosture: string;
  readonly estimatedSavingsUsd: number | null;
  readonly savingsQualifier: string;
  readonly firstValueMinutes: number;
  readonly reviewPackageUrl: string;
  readonly snapshotUrl: string;
  readonly generatedAt: string;
};

export function buildStaticCtoDemoRecapPayload(origin?: string): CtoDemoRecapPayload {
  const base = (origin ?? "").trim().replace(/\/$/, "");
  const reviewPath = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;
  const reviewPackageUrl = base.length > 0 ? `${base}${reviewPath}` : reviewPath;
  const snapshotPath = buildReadOnlyReviewWorkspaceHref(SHOWCASE_STATIC_DEMO_RUN_ID, { v: "demo" });
  const snapshotUrl = base.length > 0 ? `${base}${snapshotPath}` : snapshotPath;

  return {
    systemName: SHOWCASE_BUYER_REVIEW_TITLE,
    findingsCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
    criticalCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount,
    riskPosture: "Approved with monitoring",
    estimatedSavingsUsd: SHOWCASE_STATIC_DEMO_ILLUSTRATIVE_ANNUALIZED_EXTRACTION_USD,
    savingsQualifier: "Simulator estimate",
    firstValueMinutes: 18,
    reviewPackageUrl,
    snapshotUrl,
    generatedAt: new Date().toISOString(),
  };
}

export function buildCtoDemoRecapPayloadFromRun(
  systemName: string,
  findingsCount: number,
  criticalCount: number,
  riskPosture: string,
  estimatedSavingsUsd: number | null,
  isLiveEvidence: boolean,
  firstValueMinutes: number,
  runId: string,
  origin?: string,
): CtoDemoRecapPayload {
  const base = (origin ?? "").trim().replace(/\/$/, "");
  const reviewPath = `/architecture/reviews/${encodeURIComponent(runId)}`;
  const reviewPackageUrl = base.length > 0 ? `${base}${reviewPath}` : reviewPath;
  const snapshotPath = buildReadOnlyReviewWorkspaceHref(runId, {});
  const snapshotUrl = base.length > 0 ? `${base}${snapshotPath}` : snapshotPath;

  return {
    systemName,
    findingsCount,
    criticalCount,
    riskPosture,
    estimatedSavingsUsd,
    savingsQualifier: isLiveEvidence ? "Live evidence" : "Simulator estimate",
    firstValueMinutes,
    reviewPackageUrl,
    snapshotUrl,
    generatedAt: new Date().toISOString(),
  };
}

/** Grouped whole-dollar amount for recap copy (fixed `en-US`, no currency symbol). */
function formatRecapAmount(amountUsd: number): string {
  return new Intl.NumberFormat("en-US").format(amountUsd);
}

export function formatCtoDemoRecapMarkdown(payload: CtoDemoRecapPayload): string {
  const savingsLine =
    payload.estimatedSavingsUsd !== null
      ? `$${formatRecapAmount(payload.estimatedSavingsUsd)} (${payload.savingsQualifier})`
      : `Not available (${payload.savingsQualifier})`;

  return [
    `# ${payload.systemName} — Sponsor recap`,
    "",
    `**Findings:** ${payload.findingsCount} total (${payload.criticalCount} require attention)`,
    `**Risk posture:** ${payload.riskPosture}`,
    `**Estimated annualized value:** ${savingsLine}`,
    `**Time to first signed package:** ~${payload.firstValueMinutes} minutes`,
    `**Review:** ${payload.reviewPackageUrl}`,
    `**Snapshot (read-only, permanent):** ${payload.snapshotUrl.length > 0 ? payload.snapshotUrl : payload.reviewPackageUrl}`,
    `**Sponsor report:** ${getShowcaseSponsorHref()}`,
    "",
    `Generated ${payload.generatedAt}`,
  ].join("\n");
}

export function formatCtoDemoHeroStat(payload: CtoDemoRecapPayload): string {
  if (payload.estimatedSavingsUsd !== null) {
    return `$${formatRecapAmount(payload.estimatedSavingsUsd)} annualized risk exposure identified`;
  }

  return `${payload.findingsCount} findings · ${payload.riskPosture}`;
}

export function formatCtoDemoHeroSubStat(payload: CtoDemoRecapPayload): string {
  return `${payload.findingsCount} findings · ~${payload.firstValueMinutes} min to first signed package · ${payload.savingsQualifier}`;
}
