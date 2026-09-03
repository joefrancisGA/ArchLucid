import {
  formatProofConfidenceLabelFromTrustStatus,
  PROOF_CONFIDENCE_FIELD_LABEL,
} from "@/lib/proof-confidence-taxonomy";
import { trustEvidenceFieldOrUnavailable } from "@/lib/trust-evidence-field-snapshot";
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
  const executionMode = trustEvidenceFieldOrUnavailable(card.executionMode, "Execution mode");
  const goldenManifest = trustEvidenceFieldOrUnavailable(card.goldenManifest, "Golden manifest");
  const auditTrail = trustEvidenceFieldOrUnavailable(card.auditTrail, "Audit trail");
  const agentTraces = trustEvidenceFieldOrUnavailable(card.agentTraces, "Agent traces");
  const artifactBundlePointer = trustEvidenceFieldOrUnavailable(card.artifactBundlePointer, "Artifact bundle");
  const traceabilityExport = trustEvidenceFieldOrUnavailable(card.traceabilityExport, "Traceability export");
  const aiExplainability = trustEvidenceFieldOrUnavailable(card.aiExplainability, "AI explainability");

  const pushField = (title: string, status: string, detail?: string | null): void => {
    const extra = detail && detail.trim().length > 0 ? ` — ${detail.trim()}` : "";
    lines.push(`- **${title}:** ${status}${extra}`);
  };

  lines.push("## Evidence basis (operational)");
  lines.push("");
  lines.push(card.selfAttestationNotice ?? "");
  lines.push("");
  pushField(
    PROOF_CONFIDENCE_FIELD_LABEL,
    formatProofConfidenceLabelFromTrustStatus(executionMode.status),
  );
  pushField(executionMode.title, executionMode.status, executionMode.detail);
  pushField(goldenManifest.title, goldenManifest.status, goldenManifest.detail);
  pushField(auditTrail.title, auditTrail.status, auditTrail.detail);
  pushField(agentTraces.title, agentTraces.status, agentTraces.detail);
  pushField(artifactBundlePointer.title, artifactBundlePointer.status, artifactBundlePointer.detail);
  pushField(traceabilityExport.title, traceabilityExport.status, traceabilityExport.detail);
  pushField(aiExplainability.title, aiExplainability.status, aiExplainability.detail);

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

  for (const l of card.links ?? []) {
    lines.push(`- ${l.label}: \`${l.path}\``);
  }

  return lines.join("\n");
}
