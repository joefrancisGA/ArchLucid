import {
  formatProofConfidenceLabelFromTrustStatus,
  PROOF_CONFIDENCE_FIELD_LABEL,
} from "@/lib/proof-confidence-taxonomy";
import {
  coerceTrustEvidenceFieldStatus,
  trustEvidenceFieldOrUnavailable,
} from "@/lib/trust-evidence-field-snapshot";
import { formatTraceCompletenessDisplayLabel } from "@/lib/trust-evidence-display";
import type { RunTrustEvidenceCard } from "@/types/authority";

function formatEvidencePointersExportSummary(summary: string | null | undefined): string {
  const trimmed = summary?.trim() ?? "";

  if (trimmed.length === 0 || trimmed === "Evidence chain pointers not available.") {
    return "Evidence chain was not stored.";
  }

  return trimmed;
}

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
  if (card.selfAttestationNotice === null || card.selfAttestationNotice === undefined) {
    lines.push("Self-attestation notice was not stored.");
  } else {
    lines.push(card.selfAttestationNotice);
  }
  lines.push("");
  pushField(
    PROOF_CONFIDENCE_FIELD_LABEL,
    formatProofConfidenceLabelFromTrustStatus(executionMode.status),
  );
  pushField(executionMode.title, coerceTrustEvidenceFieldStatus(executionMode.status), executionMode.detail);
  pushField(goldenManifest.title, coerceTrustEvidenceFieldStatus(goldenManifest.status), goldenManifest.detail);
  pushField(auditTrail.title, coerceTrustEvidenceFieldStatus(auditTrail.status), auditTrail.detail);
  pushField(agentTraces.title, coerceTrustEvidenceFieldStatus(agentTraces.status), agentTraces.detail);
  pushField(
    artifactBundlePointer.title,
    coerceTrustEvidenceFieldStatus(artifactBundlePointer.status),
    artifactBundlePointer.detail,
  );
  pushField(
    traceabilityExport.title,
    coerceTrustEvidenceFieldStatus(traceabilityExport.status),
    traceabilityExport.detail,
  );
  pushField(
    aiExplainability.title,
    coerceTrustEvidenceFieldStatus(aiExplainability.status),
    aiExplainability.detail,
  );

  if (card.topFinding === null || card.topFinding === undefined) {
    lines.push("");
    lines.push("Top finding was not stored.");
  } else {
    lines.push("");
    lines.push("### Top finding (severity-first)");
    if (card.topFinding.findingId === null || card.topFinding.findingId === undefined) {
      lines.push("- Finding id was not stored.");
    } else {
      lines.push(`- **Finding id:** \`${card.topFinding.findingId}\``);
    }

    if (card.topFinding.title === null || card.topFinding.title === undefined) {
      lines.push("- Finding title was not stored.");
    } else if (card.topFinding.title) {
      lines.push(`- **Title:** ${card.topFinding.title}`);
    }

    lines.push(`- **Trace completeness:** ${formatTraceCompletenessDisplayLabel(card.topFinding.traceCompletenessLabel)}`);
    lines.push(
      `- **Evidence pointers:** ${formatEvidencePointersExportSummary(card.topFinding.evidencePointersSummary)}`,
    );
  }

  lines.push("");
  lines.push("### Evidence routes (API-relative paths)");
  lines.push("");

  if (card.links === null || card.links === undefined) {
    lines.push("Evidence route links were not stored.");
  } else if (card.links.length === 0) {
    lines.push("No evidence route links were stored.");
  } else {
    for (const l of card.links) {
      lines.push(`- ${l.label}: \`${l.path}\``);
    }
  }

  return lines.join("\n");
}
