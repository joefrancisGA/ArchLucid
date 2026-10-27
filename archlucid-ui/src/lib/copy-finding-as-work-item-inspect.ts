import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import {
  findingTrustExportJsonFields,
  formatFindingTrustExportLine,
} from "@/lib/findings/finding-trust-export";
import {
  findingWorkItemDefaultTitle,
  findingWorkItemExplainPageLinkLabel,
  findingWorkItemHeading,
  findingWorkItemInspectorLinkLabel,
  findingWorkItemReviewInProductStep,
  findingWorkItemReviewLinkLabel,
} from "@/lib/finding-work-item-product-copy";

import { resolveFindingSemanticSupportBandExportFields } from "@/lib/findings/finding-semantic-support-band-export";
import {
  formatFindingClassificationExportLine,
  formatFindingWorkItemPolicyInfluenceExportLine,
} from "@/lib/findings/finding-work-item-classification-export";

import { resolveFindingWorkItemCoverageHonestyFromInput } from "./copy-finding-as-work-item-coverage-honesty";

import {
  type FindingWorkItemBuildInput,
  type WorkItemClipboardFormat,
  workItemStoredText,
} from "./copy-finding-as-work-item-types";

function coverageHonestyLineForExport(input: FindingWorkItemBuildInput): string | null {
  if (input.includeCoverageHonesty === false) {
    return null;
  }

  const resolved = resolveFindingWorkItemCoverageHonestyFromInput(input);

  return resolved?.line ?? null;
}

function coverageHonestyJsonFields(
  input: FindingWorkItemBuildInput,
): { coverageHonesty?: string; coverageHonestyProvenanceKind?: FindingWorkItemBuildInput["coverageHonestyProvenanceKind"] } {
  const line = coverageHonestyLineForExport(input);

  if (line === null) {
    return {};
  }

  const fields: {
    coverageHonesty: string;
    coverageHonestyProvenanceKind?: FindingWorkItemBuildInput["coverageHonestyProvenanceKind"];
  } = {
    coverageHonesty: line,
  };

  if (input.coverageHonestyProvenanceKind !== undefined && input.coverageHonestyProvenanceKind !== null) {
    fields.coverageHonestyProvenanceKind = input.coverageHonestyProvenanceKind;
  }

  return fields;
}

function businessImpactForExport(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "Business impact was not stored.";
  }

  return value;
}

function findingHeading(input: FindingWorkItemBuildInput): string {
  const categoryMissing = input.categoryLabel === null || input.categoryLabel === undefined;
  const titleMissing = input.title === null || input.title === undefined;

  if (categoryMissing && titleMissing) {
    return "Finding title was not stored.";
  }

  if (input.title === "" || input.categoryLabel === "") {
    return "Finding title was stored empty.";
  }

  const parts = [input.categoryLabel?.trim(), input.title?.trim()].filter((x) => x !== undefined && x !== null && x.length > 0);

  return parts.join(" — ") || "Finding title was stored empty.";
}

function ruleSummary(
  decisionRuleName: string | null | undefined,
  decisionRuleId: string | null | undefined,
): string {
  const nameMissing = decisionRuleName === null || decisionRuleName === undefined;
  const idMissing = decisionRuleId === null || decisionRuleId === undefined;

  if (nameMissing && idMissing) {
    return "Decision rule was not stored.";
  }

  const name = nameMissing ? "" : decisionRuleName.trim();
  const id = idMissing ? "" : decisionRuleId.trim();

  if (name.length === 0 && id.length === 0) {
    return "Decision rule was stored empty.";
  }

  if (name.length > 0 && id.length > 0) {
    return `${name} (${id})`;
  }

  if (name.length > 0) {
    return name;
  }

  if (id.length > 0) {
    return `Rule name was not stored. Rule id ${id}.`;
  }

  return "Decision rule was stored empty.";
}

/**
 * Builds Markdown or wiki text for copying into Jira, GitHub Issues, or Azure Boards.
 */
export function buildInspectFindingWorkItemBody(format: WorkItemClipboardFormat, input: FindingWorkItemBuildInput): string {
  const origin = input.siteOrigin.replace(/\/$/, "");
  const runPath = `/architecture/reviews/${encodeURIComponent(input.runId)}`;
  const base = `${origin}${runPath}`;
  const explainUrl = `${base}/findings/${encodeURIComponent(input.findingId)}`;
  const inspectUrl = `${origin}${getFindingEvidenceTraceHref(input.runId, input.findingId)}`;
  const heading = findingHeading(input);

  const whatFlagged = workItemStoredText(
    input.description,
    "Description was not stored.",
    "Description was stored empty.",
  );

  const whyItMatters = businessImpactForExport(input.impactedAreaLabel);
  const reco = workItemStoredText(
    input.recommendedAction,
    "Recommended action was not stored.",
    "Recommended action was stored empty.",
  );
  const severity = workItemStoredText(input.severityLabel, "Severity was not stored.");
  const ruleLine = ruleSummary(input.decisionRuleName, input.decisionRuleId);
  const trustLine = formatFindingTrustExportLine(input);
  const trustJson = findingTrustExportJsonFields(input);
  const semanticSupportFields = resolveFindingSemanticSupportBandExportFields({
    classification: input.classification ?? null,
    semanticSupportBand: input.semanticSupportBand ?? null,
    semanticSupportBandScorerVersion: input.semanticSupportBandScorerVersion ?? null,
  });
  const classificationLine = formatFindingClassificationExportLine(input.classification ?? null, input.treatment);
  const policyInfluenceLine = formatFindingWorkItemPolicyInfluenceExportLine();
  const coverageHonestyLine = coverageHonestyLineForExport(input);
  const coverageHonestyJson = coverageHonestyJsonFields(input);

  const evidenceBlock =
    input.evidenceExcerpts.length > 0
      ? input.evidenceExcerpts.map((e) => `- ${e}`).join("\n")
      : "- Evidence excerpt was not stored.";

  if (format === "json") {
    return JSON.stringify(
      {
        schema: "archlucid.work-item.v1",
        findingId: input.findingId,
        runId: input.runId,
        title: heading,
        severity,
        recommendedAction: reco,
        status: "Status was not included on this work item.",
        ruleId: ruleLine,
        ...trustJson,
        ...(semanticSupportFields === null
          ? {}
          : {
              semanticSupportBand: semanticSupportFields.semanticSupportBand,
              semanticSupportBandScorerVersion: semanticSupportFields.semanticSupportBandScorerVersion,
            }),
        ...(classificationLine === null ? {} : { classification: classificationLine }),
        policyInfluenceHonesty: policyInfluenceLine,
        ...coverageHonestyJson,
        whatWasFlagged: whatFlagged,
        whyItMatters,
        evidence:
          input.evidenceExcerpts.length > 0 ? input.evidenceExcerpts : ["Evidence excerpt was not stored."],
        links: {
          review: base,
          finding: explainUrl,
          inspect: inspectUrl,
        },
      },
      null,
      2,
    );
  }

  if (format === "jiraWiki") {
    const lines = [
      `h2. ${findingWorkItemHeading(input.productLineId, heading)}`,
      "",
      "*Severity:* " + severity,
      `*Finding ID:* {{${input.findingId}}}`,
      "",
      "*Run:* " + "`" + input.runId + "`",
      `*Decision rule:* ${ruleLine}`,
    ];

    if (trustLine !== null) {
      lines.push(`*Trust label:* ${trustLine}`);
    }

    if (classificationLine !== null) {
      lines.push(`*Classification:* ${classificationLine}`);
    }

    lines.push(`*Policy influence:* ${policyInfluenceLine}`);

    if (coverageHonestyLine !== null) {
      lines.push(`*Coverage honesty:* ${coverageHonestyLine}`);
    }

    lines.push(
      "",
      "*What was flagged*",
      whatFlagged,
      "",
      "*Why it matters*",
      whyItMatters,
      "",
      "*Recommended actions*",
      reco,
      "",
      "*Evidence*",
      ...(input.evidenceExcerpts.length > 0
        ? input.evidenceExcerpts.map((e) => `* ${e}`)
        : ["* Evidence excerpt was not stored."]),
      "",
      "*Links*",
      `* (${explainUrl}|${findingWorkItemExplainPageLinkLabel(input.productLineId)})`,
      `* (${inspectUrl}|Structured inspector — Why?)`,
    );

    return lines.join("\n");
  }

  if (format === "serviceNowText") {
    const evidenceLines =
      input.evidenceExcerpts.length > 0
        ? input.evidenceExcerpts.map((e, index) => `${index + 1}. ${e}`)
        : ["1. Evidence excerpt was not stored."];

    const remediationStep = reco;
    const descriptionLines = [`Severity: ${severity}`];

    if (trustLine !== null) {
      descriptionLines.push(`Trust label: ${trustLine}`);
    }

    if (classificationLine !== null) {
      descriptionLines.push(`Classification: ${classificationLine}`);
    }

    descriptionLines.push(`Policy influence: ${policyInfluenceLine}`);

    if (coverageHonestyLine !== null) {
      descriptionLines.push(`Coverage honesty: ${coverageHonestyLine}`);
    }

    return [
      `Short description: ${heading} (${input.findingId})`,
      "",
      "Description:",
      ...descriptionLines,
      "",
      "What was flagged:",
      whatFlagged,
      "",
      "Why it matters:",
      whyItMatters,
      "",
      "Recommended action:",
      reco,
      "",
      "Evidence:",
      ...evidenceLines,
      "",
      "Steps to resolve:",
      `1. ${findingWorkItemReviewInProductStep(input.productLineId)}`,
      `2. ${remediationStep}`,
      "",
      `${findingWorkItemInspectorLinkLabel(input.productLineId)}: ${inspectUrl}`,
      `Finding ID: ${input.findingId}`,
      `Run ID: ${input.runId}`,
    ].join("\n");
  }

  const markdownLines = [
    `## Finding: ${heading}`,
    "",
    "**Severity:** " + severity,
    "**Finding ID:** `" + input.findingId + "`",
    "**Run:** `" + input.runId + "`",
    "**Decision rule:** " + ruleLine,
  ];

  if (trustLine !== null) {
    markdownLines.push("**Trust label:** " + trustLine);
  }

  if (classificationLine !== null) {
    markdownLines.push("**Classification:** " + classificationLine);
  }

  markdownLines.push("**Policy influence:** " + policyInfluenceLine);

  if (coverageHonestyLine !== null) {
    markdownLines.push("**Coverage honesty:** " + coverageHonestyLine);
  }

  markdownLines.push(
    "",
    "### What was flagged",
    whatFlagged,
    "",
    "### Why it matters",
    whyItMatters,
    "",
    "### Recommended actions",
    reco,
    "",
    "### Evidence",
    evidenceBlock,
    "",
    "### Links",
    `- ${findingWorkItemReviewLinkLabel(input.productLineId)}: ${base}`,
    `- Finding (explain page): ${explainUrl}`,
    `- Structured inspector: ${inspectUrl}`,
  );

  return markdownLines.join("\n");
}
