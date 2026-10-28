import { formatFindingTrustExportLine } from "@/lib/findings/finding-trust-export";
import { RISK_POSTURE_NOT_STORED_LABEL } from "@/lib/verdict-taxonomy";

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
    return "ADR status was not stored.";
  }

  return manifestStatusLabel.trim();
}

function reviewCapturedDateLine(createdUtc: string): string {
  const trimmed = createdUtc.trim();

  if (trimmed.length === 0) {
    return "Review captured date was not stored.";
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return "Review captured date was not readable.";
  }

  return parsed.toISOString().slice(0, 10);
}

function formatThemeSummariesSection(exp: AdrGeneratorRunInput["explanation"]): string {
  if (exp === null || exp.themeSummaries === null) {
    return "_Theme summaries were not stored._\n";
  }

  if (exp.themeSummaries.length === 0) {
    return "_Theme summaries were stored empty._\n";
  }

  return bulletBlock(exp.themeSummaries);
}

function formatFindingRecommendationLine(recommendation: string): string {
  if (recommendation.trim().length > 0) {
    return recommendation.trim();
  }

  return "_Recommendation was stored empty._";
}

function formatAdrExportFindingTitle(title: string): string {
  const trimmed = title.trim();

  return trimmed.length > 0 ? trimmed : "Finding title was not stored.";
}

function bulletBlock(lines: readonly string[]): string {
  const clean = lines.map((l) => l.trim()).filter((l) => l.length > 0);

  if (clean.length === 0) {
    return "_None captured in this review export._\n";
  }

  return `${clean.map((l) => `- ${l}`).join("\n")}\n`;
}

/** MADR-inspired markdown (Title, Status, Context, Decision, Consequences). */
export type BuildMadrMarkdownFromRunOptions = {
  /** Shared PC-01 / PC-13 honesty block prepended when Working career exports include ADR markdown. */
  readonly careerExportHonestyMarkdown?: string | null;
};

/** MADR-inspired markdown (Title, Status, Context, Decision, Consequences). */
export function buildMadrMarkdownFromRun(
  input: AdrGeneratorRunInput,
  options?: BuildMadrMarkdownFromRunOptions,
): string {
  const titleLine = input.reviewTitle.trim().length > 0 ? input.reviewTitle.trim() : "Review title was not stored.";
  const status = adrStatusFromManifestLabel(input.manifestStatusLabel);
  const dateLine = reviewCapturedDateLine(input.createdUtc);
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
  } else {
    contextReviewSignals.push("Policy pack label was not stored.");
  }

  if (input.manifestCounts !== null) {
    const c = input.manifestCounts;

    contextReviewSignals.push(
      `Counts — decisions: ${c.decisions}, warnings: ${c.warnings}, unresolved issues: ${c.unresolvedIssues}`,
    );
  } else {
    contextReviewSignals.push("Manifest counts were not stored.");
  }

  const narrativePieces: string[] = [];

  if (exp !== null) {
    if (exp.overallAssessment.length > 0) {
      narrativePieces.push(`_Overall assessment:_ ${exp.overallAssessment}`);
    } else {
      narrativePieces.push("Overall assessment was not stored.");
    }

    if (exp.summary.length > 0) {
      narrativePieces.push(`_Summary:_ ${exp.summary}`);
    }

    if (exp.detailedNarrative.length > 0) {
      narrativePieces.push(`_Detailed narrative:_ ${truncatePlain(exp.detailedNarrative, NARRATIVE_CAP)}`);
    }

    if (exp.structuredReasoning === null) {
      narrativePieces.push("Structured reasoning was not stored.");
    } else if (exp.structuredReasoning.trim().length > 0) {
      narrativePieces.push(`_Structured model reasoning:_ ${truncatePlain(exp.structuredReasoning, EXCERPT_CAP)}`);
    } else {
      narrativePieces.push("Structured reasoning was stored empty.");
    }
  }

  const contextAi = narrativePieces.length > 0 ? narrativePieces.join("\n\n") : "_No aggregate AI narrative was available for this review._";

  const themes = formatThemeSummariesSection(exp);

  const findingsSection =
    input.findings.length === 0
      ? "_Findings were not included in this export._\n"
      : input.findings
          .map((f, i) => {
            const rec = formatFindingRecommendationLine(f.recommendation);
            const excerpt =
              f.aiReasoningExcerpt.trim().length > 0
                ? `\n\n_AI reasoning excerpt:_ ${f.aiReasoningExcerpt.trim()}`
                : "";
            const trustLine = formatFindingTrustExportLine(f);
            const trustBullet =
              trustLine !== null ? `\n- **Trust label:** ${trustLine}` : "";
            const provenanceKind = f.provenanceKind ?? "Provenance kind was not stored.";
            const semanticSupportBullet =
              f.semanticSupportBand !== null
              && f.semanticSupportBand !== undefined
              && f.semanticSupportBand.trim().length > 0
                ? `\n- **Semantic support:** ${f.semanticSupportBand} (scorer ${f.semanticSupportBandScorerVersion?.trim() || "Scorer version was not stored."})`
                : "";

            return `### ${i + 1}. [${f.severityLabel}] ${formatAdrExportFindingTitle(f.title)}\n\n- **Finding id:** \`${f.findingId}\`${trustBullet}${semanticSupportBullet}\n- **Provenance:** ${provenanceKind}\n- **Recommendation / reasoning:** ${rec}${excerpt}\n`;
          })
          .join("\n");

  const findingProvenanceSection =
    input.findings.length === 0
      ? ""
      : [
          "## Finding provenance",
          "",
          "| Finding | Provenance |",
          "| --- | --- |",
          ...input.findings.map(
            (finding) =>
              `| \`${finding.findingId}\` — ${formatAdrExportFindingTitle(finding.title)} | ${finding.provenanceKind ?? "Provenance kind was not stored."} |`,
          ),
          "",
        ].join("\n");

  const decisionDrivers = exp !== null && exp.keyDrivers !== null ? exp.keyDrivers : [];
  const decisionFromDrivers =
    decisionDrivers.length > 0
      ? `Recorded decision drivers from the automated assessment:\n\n${bulletBlock(decisionDrivers)}`
      : "Decision text was not stored.";

  function consequenceListSection(
    heading: string,
    values: readonly string[] | null,
    notStoredLabel: string,
    storedEmptyLabel: string,
  ): string {
    if (values === null) {
      return `${heading}\n\n${notStoredLabel}`;
    }

    if (values.length === 0) {
      return `${heading}\n\n${storedEmptyLabel}`;
    }

    return `${heading}\n\n${bulletBlock(values)}`;
  }

  const consequencesSections: string[] = [];

  if (exp !== null) {
    consequencesSections.push(
      consequenceListSection(
        "### Risk implications",
        exp.riskImplications,
        "Risk implications were not stored.",
        "Risk implications were stored empty.",
      ),
    );
    consequencesSections.push(
      consequenceListSection(
        "### Cost / operations",
        exp.costImplications,
        "Cost implications were not stored.",
        "Cost implications were stored empty.",
      ),
    );
    consequencesSections.push(
      consequenceListSection(
        "### Compliance / governance",
        exp.complianceImplications,
        "Compliance implications were not stored.",
        "Compliance implications were stored empty.",
      ),
    );

    if (exp.alternativesConsidered === null) {
      consequencesSections.push("Alternatives considered were not stored.");
    } else if (exp.alternativesConsidered.length > 0) {
      consequencesSections.push(`### Alternatives considered (model-reported)\n\n${bulletBlock(exp.alternativesConsidered)}`);
    }
  }

  const caveatLines: string[] = [
    "This document was **drafted client-side** from ArchLucid run exports. It is **not** a substitute for human architecture review, security sign-off, or contractually binding decision logs.",
  ];

  if (
    exp !== null
    && (exp.deterministicFallbackUsed === null || exp.deterministicFallbackUsed === undefined)
  ) {
    caveatLines.push("Deterministic fallback was not stored.");
  } else if (exp !== null && exp.deterministicFallbackUsed === true) {
    caveatLines.push("Aggregate text may include **deterministic substitution** where LLM output was unavailable or low-faithfulness.");
  }

  if (
    exp !== null
    && (exp.faithfulnessWarning === null || exp.faithfulnessWarning === undefined)
  ) {
    caveatLines.push("Faithfulness warning was not stored.");
  } else if (exp !== null && exp.faithfulnessWarning !== null && exp.faithfulnessWarning.length > 0) {
    caveatLines.push(`Faithfulness / quality note: ${exp.faithfulnessWarning}`);
  }

  if (exp !== null) {
    if (exp.caveats === null) {
      caveatLines.push("Caveats were not stored.");
    } else if (exp.caveats.length > 0) {
      caveatLines.push(...exp.caveats);
    }
  }

  const provenance =
    exp !== null && exp.provenanceLine !== null && exp.provenanceLine.length > 0
      ? `\n**Explanation provenance (aggregate):** ${exp.provenanceLine}\n`
      : "";

  const honestyPrefix =
    options?.careerExportHonestyMarkdown !== null
    && options?.careerExportHonestyMarkdown !== undefined
    && options.careerExportHonestyMarkdown.trim().length > 0
      ? `${options.careerExportHonestyMarkdown.trim()}\n\n`
      : "";

  return `${honestyPrefix}# ADR: ${titleLine}

## Status

${status}

## Context

### Review signals

${bulletBlock(contextReviewSignals)}

### Risk posture (aggregate label)

${exp !== null && exp.riskPosture.length > 0 ? exp.riskPosture : `_${RISK_POSTURE_NOT_STORED_LABEL}_`}

### AI assessment / narrative

${contextAi}

### Themes

${themes}

### Findings (prioritized snapshot)

${findingsSection}
${findingProvenanceSection}
## Decision

${decisionFromDrivers}

## Consequences

${consequencesSections.join("\n\n")}

## Caveats

${bulletBlock(caveatLines)}
${provenance}
`;

}
