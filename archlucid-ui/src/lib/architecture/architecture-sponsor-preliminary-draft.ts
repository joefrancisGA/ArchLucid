import type { SponsorReadinessStatus } from "@/lib/architecture/architecture-sponsor-readiness";

export type BuildArchitectureSponsorDraftInput = {
  readonly runId: string;
  readonly architectureName: string;
  readonly architectureOverview: string;
  readonly businessOutcome: string;
  readonly ownerLabel: string | null;
  readonly knownGaps: readonly string[];
  readonly confidentialityLabel: string | null;
  readonly generatedAtIso: string;
  readonly readinessStatus: SponsorReadinessStatus;
  readonly siteOrigin: string;
};

export type ArchitectureSponsorDraftWatermark = {
  readonly preliminaryDraft: true;
  readonly dateGenerated: string;
  readonly knownGaps: readonly string[];
  readonly notApproved: true;
  readonly confidentialityLabel: string;
};

export function buildArchitectureSponsorDraftWatermark(
  input: Pick<
    BuildArchitectureSponsorDraftInput,
    "knownGaps" | "confidentialityLabel" | "generatedAtIso"
  >,
): ArchitectureSponsorDraftWatermark {
  return {
    preliminaryDraft: true,
    dateGenerated: input.generatedAtIso,
    knownGaps: input.knownGaps,
    notApproved: true,
    confidentialityLabel: input.confidentialityLabel ?? "Internal — preliminary architecture draft",
  };
}

function formatDateLabel(iso: string): string {
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Sponsor-facing markdown with required preliminary draft watermark fields. */
export function buildArchitectureSponsorShareMarkdown(input: BuildArchitectureSponsorDraftInput): string {
  const watermark = buildArchitectureSponsorDraftWatermark(input);
  const reviewUrl = `${input.siteOrigin.replace(/\/$/, "")}/architecture/reviews/${encodeURIComponent(input.runId)}`;
  const gapLines =
    watermark.knownGaps.length > 0
      ? watermark.knownGaps.map((gap) => `- ${gap}`)
      : ["- No explicit gaps recorded"];

  return [
    "> **Preliminary draft**",
    `> **Date generated:** ${formatDateLabel(watermark.dateGenerated)}`,
    "> **Not approved**",
    `> **Confidentiality:** ${watermark.confidentialityLabel}`,
    "> **Known gaps:**",
    ...gapLines.map((line) => `> ${line.replace(/^- /, "")}`),
    "",
    `# ${input.architectureName}`,
    "",
    "## Architecture overview",
    input.architectureOverview.trim().length > 0
      ? input.architectureOverview.trim()
      : "Architecture overview is still being clarified.",
    "",
    "## Business outcome",
    input.businessOutcome.trim().length > 0
      ? input.businessOutcome.trim()
      : "Business outcome is still being confirmed.",
    "",
    `**Owner:** ${input.ownerLabel?.trim() || "Unassigned"}`,
    `**Sponsor readiness:** ${input.readinessStatus}`,
    "",
    `**Source architecture:** ${reviewUrl}`,
  ].join("\n");
}
