import {
  formatProofConfidenceLabelFromTrustStatus,
  PROOF_CONFIDENCE_FIELD_LABEL,
} from "@/lib/proof-confidence-taxonomy";
import type { RunTrustEvidenceCard } from "@/types/authority";

export function appendTrustEvidenceMarkdownSection(body: string, card: RunTrustEvidenceCard | null | undefined): string {
  if (!card) {
    return body;
  }

  return `${body.trimEnd()}\n\n${formatTrustEvidenceCardMarkdown(card)}\n`;
}

/** Reusable Markdown block for sponsor packets (mirrors the committed-run trust evidence card). */
export function formatTrustEvidenceCardMarkdown(card: RunTrustEvidenceCard): string {
  const lines: string[] = [];

  const pushField = (title: string, status: string, detail?: string | null): void => {
    const extra = detail && detail.trim().length > 0 ? ` — ${detail.trim()}` : "";
    lines.push(`- **${title}:** ${status}${extra}`);
  };

  lines.push("## Evidence basis (operational)");
  lines.push("");
  lines.push(card.selfAttestationNotice);
  lines.push("");
  pushField(
    PROOF_CONFIDENCE_FIELD_LABEL,
    formatProofConfidenceLabelFromTrustStatus(card.executionMode.status),
  );
  pushField(card.executionMode.title, card.executionMode.status, card.executionMode.detail);
  pushField(card.goldenManifest.title, card.goldenManifest.status, card.goldenManifest.detail);
  pushField(card.auditTrail.title, card.auditTrail.status, card.auditTrail.detail);
  pushField(card.agentTraces.title, card.agentTraces.status, card.agentTraces.detail);
  pushField(card.artifactBundlePointer.title, card.artifactBundlePointer.status, card.artifactBundlePointer.detail);
  pushField(card.traceabilityExport.title, card.traceabilityExport.status, card.traceabilityExport.detail);
  pushField(card.aiExplainability.title, card.aiExplainability.status, card.aiExplainability.detail);

  if (card.topFinding) {
    lines.push("");
    lines.push("### Top finding (severity-first)");
    lines.push(`- **Finding id:** \`${card.topFinding.findingId}\``);

    if (card.topFinding.title) {
      lines.push(`- **Title:** ${card.topFinding.title}`);
    }

    lines.push(`- **Trace completeness:** ${card.topFinding.traceCompletenessLabel}`);
    lines.push(`- **Evidence pointers:** ${card.topFinding.evidencePointersSummary}`);
  }

  lines.push("");
  lines.push("### Evidence routes (API-relative paths)");
  lines.push("");

  for (const l of card.links) {
    lines.push(`- ${l.label}: \`${l.path}\``);
  }

  return lines.join("\n");
}
