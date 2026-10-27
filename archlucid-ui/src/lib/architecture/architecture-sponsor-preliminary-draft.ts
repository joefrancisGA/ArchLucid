import type { SponsorReadinessStatus } from "@/lib/architecture/architecture-sponsor-readiness";
import { UNTITLED_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-draft-status";
import { formatConversationListDate } from "@/lib/locale-datetime";

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
    confidentialityLabel: input.confidentialityLabel?.trim() || "Confidentiality was not stored.",
  };
}

function formatDateLabel(iso: string): string {
  const parsed = new Date(iso);

  // Unparseable input keeps the raw value: the watermark must show what was recorded, not an em dash.
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }

  return formatConversationListDate(iso);
}

/** Sponsor-facing markdown with required preliminary draft watermark fields. */
export function buildArchitectureSponsorShareMarkdown(input: BuildArchitectureSponsorDraftInput): string {
  const watermark = buildArchitectureSponsorDraftWatermark(input);
  const reviewUrl = `${input.siteOrigin.replace(/\/$/, "")}/architecture/reviews/${encodeURIComponent(input.runId)}`;
  const readinessCheckLines =
    watermark.knownGaps.length > 0
      ? watermark.knownGaps.map((gap) => `- ${gap}`)
      : ["- Readiness check listed no gaps."];

  return [
    "> **Preliminary draft**",
    `> **Date generated:** ${formatDateLabel(watermark.dateGenerated)}`,
    "> **Governance approval:** Not recorded — this preliminary draft is not approved for external circulation.",
    `> **Confidentiality:** ${watermark.confidentialityLabel}`,
    "> **Readiness check:**",
    ...readinessCheckLines.map((line) => `> ${line.replace(/^- /, "")}`),
    "",
    `# ${input.architectureName.trim().length > 0 ? input.architectureName.trim() : UNTITLED_ARCHITECTURE_LABEL}`,
    "",
    "## Architecture overview",
    input.architectureOverview.trim().length > 0
      ? input.architectureOverview.trim()
      : "Architecture overview was not stored.",
    "",
    "## Business outcome",
    input.businessOutcome.trim().length > 0
      ? input.businessOutcome.trim()
      : "Business outcome was not stored.",
    "",
    `**Owner:** ${input.ownerLabel?.trim() || "Sponsor owner was not stored."}`,
    `**Sponsor readiness:** ${input.readinessStatus}`,
    "",
    `**Source architecture:** ${reviewUrl}`,
  ].join("\n");
}
