import { formatFindingTrustExportLine } from "@/lib/findings/finding-trust-export";

import {
  EXCERPT_CAP,
  NARRATIVE_CAP,
  type AdrGeneratorRunInput,
} from "./adr-from-run-slices";

function truncatePlain(text: string, maxChars: number): string {
  const t = text.trim();

  if (t.length === 0) {
    return "";
  }

  if (t.length <= maxChars) {
    return t;
  }

  return `${t.slice(0, Math.max(0, maxChars - 1))}…`;
}

function adrStatusFromManifestLabel(manifestStatusLabel: string | null): string {
  if (manifestStatusLabel === null || manifestStatusLabel.trim().length === 0) {
    return "proposed";
  }

  const lower = manifestStatusLabel.trim().toLowerCase();

  if (
    lower.includes("commit") ||
    lower.includes("accepted") ||
    lower.includes("approved") ||
    lower.includes("final")
  ) {
    return "accepted";
  }

  return "proposed";
}

function isoDateOnly(isoUtc: string): string {
  const d = new Date(isoUtc);

  if (Number.isNaN(d.getTime())) {
    return isoUtc.trim();
  }

  return d.toISOString().slice(0, 10);
}

function bulletBlock(lines: readonly string[]): string {
  const clean = lines.map((l) => l.trim()).filter((l) => l.length > 0);

  if (clean.length === 0) {
    return "_None captured in this review export._\n";
  }

  return `${clean.map((l) => `- ${l}`).join("\n")}\n`;
}

/** MADR-inspired markdown (Title, Status, Context, Decision, Consequences). */
export function buildMadrMarkdownFromRun(input: AdrGeneratorRunInput): string {
  const titleLine = input.reviewTitle.trim().length > 0 ? input.reviewTitle.trim() : `Architecture review ${input.runId}`;
  const status = adrStatusFromManifestLabel(input.manifestStatusLabel);
  const dateLine = isoDateOnly(input.createdUtc);
  const exp = input.explanation;

  const contextReviewSignals: string[] = [
    `ArchLucid review / run id: \`${input.runId}\``,
    `Project id: \`${input.projectId}\``,
    `Review captured (UTC date): ${dateLine}`,
  ];

  if (input.manifestStatusLabel !== null && input.manifestStatusLabel.trim().length > 0) {
    contextReviewSignals.push(`Manifest status (UI label): ${input.manifestStatusLabel.trim()}`);
  } else {
    contextReviewSignals.push("Manifest status: _not available on this export_");
  }

  if (input.policyPackLabel !== null && input.policyPackLabel.trim().length > 0) {
    contextReviewSignals.push(`Policy pack (UI label): ${input.policyPackLabel.trim()}`);
  }

  if (input.manifestCounts !== null) {
    const c = input.manifestCounts;

    contextReviewSignals.push(
      `Counts — decisions: ${c.decisions}, warnings: ${c.warnings}, unresolved issues: ${c.unresolvedIssues}`,
    );
  }

  const narrativePieces: string[] = [];

  if (exp !== null) {
    if (exp.overallAssessment.length > 0) {
      narrativePieces.push(exp.overallAssessment);
    }

    if (exp.summary.length > 0 && exp.summary !== exp.overallAssessment) {
      narrativePieces.push(exp.summary);
    }

    if (exp.detailedNarrative.length > 0) {
      narrativePieces.push(truncatePlain(exp.detailedNarrative, NARRATIVE_CAP));
    }

    if (exp.structuredReasoning !== null && exp.structuredReasoning.trim().length > 0) {
      narrativePieces.push(`_Structured model reasoning:_ ${truncatePlain(exp.structuredReasoning, EXCERPT_CAP)}`);
    }
  }

  const contextAi = narrativePieces.length > 0 ? narrativePieces.join("\n\n") : "_No aggregate AI narrative was available for this review._";

  const themes =
    exp !== null && exp.themeSummaries.length > 0
      ? bulletBlock(exp.themeSummaries)
      : "_No theme bullets were listed._\n";

  const findingsSection =
    input.findings.length === 0
      ? "_No findings were included in this export (empty run snapshot or muted-only set)._\n"
      : input.findings
          .map((f, i) => {
            const rec =
              f.recommendation.trim().length > 0
                ? f.recommendation.trim()
                : f.aiReasoningExcerpt.trim().length > 0
                  ? f.aiReasoningExcerpt.trim()
                  : "_No recommendation text._";
            const excerpt =
              f.aiReasoningExcerpt.trim().length > 0 && f.aiReasoningExcerpt.trim() !== rec
                ? `\n\n_AI reasoning excerpt:_ ${f.aiReasoningExcerpt.trim()}`
                : "";
            const trustLine = formatFindingTrustExportLine(f);
            const trustBullet =
              trustLine !== null ? `\n- **Trust label:** ${trustLine}` : "";

            return `### ${i + 1}. [${f.severityLabel}] ${f.title}\n\n- **Finding id:** \`${f.findingId}\`${trustBullet}\n- **Recommendation / reasoning:** ${rec}${excerpt}\n`;
          })
          .join("\n");

  const decisionDrivers = exp !== null ? exp.keyDrivers : [];
  const decisionFromDrivers =
    decisionDrivers.length > 0
      ? `We record the following decision drivers from the automated assessment:\n\n${bulletBlock(decisionDrivers)}\nBased on these drivers and the cited findings, we **${status === "accepted" ? "accept" : "propose"}** aligning implementation and governance with the review recommendations, pending human approval.`
      : `Based on the ${input.findings.length > 0 ? "captured findings" : "available run metadata"} and ${exp !== null ? "the aggregate assessment" : "operator context"}, we **${status === "accepted" ? "accept" : "propose"}** treating this review as the architecture decision record draft until stakeholders ratify it outside ArchLucid.`;

  const consequencesSections: string[] = [];

  if (exp !== null) {
    if (exp.riskImplications.length > 0) {
      consequencesSections.push(`### Risk implications\n\n${bulletBlock(exp.riskImplications)}`);
    }

    if (exp.costImplications.length > 0) {
      consequencesSections.push(`### Cost / operations\n\n${bulletBlock(exp.costImplications)}`);
    }

    if (exp.complianceImplications.length > 0) {
      consequencesSections.push(`### Compliance / governance\n\n${bulletBlock(exp.complianceImplications)}`);
    }

    if (exp.alternativesConsidered !== null && exp.alternativesConsidered.length > 0) {
      consequencesSections.push(`### Alternatives considered (model-reported)\n\n${bulletBlock(exp.alternativesConsidered)}`);
    }
  }

  if (consequencesSections.length === 0) {
    consequencesSections.push(
      "_No structured consequence lists were returned._ Capture operational, security, and cost follow-ups manually after team review.",
    );
  }

  const caveatLines: string[] = [
    "This document was **drafted client-side** from ArchLucid run exports. It is **not** a substitute for human architecture review, security sign-off, or contractually binding decision logs.",
  ];

  if (exp !== null && exp.deterministicFallbackUsed) {
    caveatLines.push("Aggregate text may include **deterministic substitution** where LLM output was unavailable or low-faithfulness.");
  }

  if (exp !== null && exp.faithfulnessWarning !== null && exp.faithfulnessWarning.length > 0) {
    caveatLines.push(`Faithfulness / quality note: ${exp.faithfulnessWarning}`);
  }

  if (exp !== null && exp.caveats !== null && exp.caveats.length > 0) {
    caveatLines.push(...exp.caveats);
  }

  const provenance =
    exp !== null && exp.provenanceLine !== null && exp.provenanceLine.length > 0
      ? `\n**Explanation provenance (aggregate):** ${exp.provenanceLine}\n`
      : "";

  return `# ADR: ${titleLine}

## Status

${status}

## Context

### Review signals

${bulletBlock(contextReviewSignals)}

### Risk posture (aggregate label)

${exp !== null && exp.riskPosture.length > 0 ? exp.riskPosture : "_Not specified._"}

### AI assessment / narrative

${contextAi}

### Themes

${themes}

### Findings (prioritized snapshot)

${findingsSection}

## Decision

${decisionFromDrivers}

## Consequences

${consequencesSections.join("\n\n")}

## Caveats

${bulletBlock(caveatLines)}
${provenance}
`;

}
