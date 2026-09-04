import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import {
  findingTrustExportJsonFields,
  formatFindingTrustExportLine,
} from "@/lib/findings/finding-trust-export";

import { resolveFindingWorkItemCoverageHonestyFromInput } from "./copy-finding-as-work-item-coverage-honesty";

import {
  na,
  type FindingWorkItemBuildInput,
  type WorkItemClipboardFormat,
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

function findingHeading(categoryLabel: string | null, title: string | null): string {
  const parts = [categoryLabel?.trim(), title?.trim()].filter((x) => x !== undefined && x !== null && x.length > 0);

  return parts.join(" — ") || "ArchLucid finding";
}

function ruleSummary(decisionRuleName: string | null, decisionRuleId: string | null): string {
  const name = decisionRuleName?.trim();
  const id = decisionRuleId?.trim();

  const nameOk = name !== undefined && name.length > 0;
  const idOk = id !== undefined && id.length > 0;

  if (nameOk && idOk) {
    return `${name} (${id})`;
  }

  if (nameOk) {
    return name;
  }

  if (idOk) {
    return id;
  }

  return "Not available";
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
  const heading = findingHeading(input.categoryLabel, input.title);

  const whatFlagged = na(input.description);

  const whyItMatters = na(input.impactedAreaLabel);
  const reco = na(input.recommendedAction);
  const severity = na(input.severityLabel);
  const ruleLine = ruleSummary(input.decisionRuleName, input.decisionRuleId);
  const trustLine = formatFindingTrustExportLine(input);
  const trustJson = findingTrustExportJsonFields(input);
  const coverageHonestyLine = coverageHonestyLineForExport(input);
  const coverageHonestyJson = coverageHonestyJsonFields(input);

  const evidenceBlock =
    input.evidenceExcerpts.length > 0 ? input.evidenceExcerpts.map((e) => `- ${na(e)}`).join("\n") : "- Not available";

  if (format === "json") {
    return JSON.stringify(
      {
        schema: "archlucid.work-item.v1",
        findingId: input.findingId,
        runId: input.runId,
        title: heading,
        severity,
        recommendedAction: reco,
        status: "Not available",
        ruleId: ruleLine,
        ...trustJson,
        ...coverageHonestyJson,
        whatWasFlagged: whatFlagged,
        whyItMatters,
        evidence: input.evidenceExcerpts.length > 0 ? input.evidenceExcerpts : ["Not available"],
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
      `h2. ArchLucid Finding — ${heading}`,
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
        ? input.evidenceExcerpts.map((e) => `* ${na(e)}`)
        : ["* Not available"]),
      "",
      "*Links*",
      `* (${explainUrl}|ArchLucid finding — explain page)`,
      `* (${inspectUrl}|Structured inspector — Why?)`,
    );

    return lines.join("\n");
  }

  if (format === "serviceNowText") {
    const evidenceLines =
      input.evidenceExcerpts.length > 0
        ? input.evidenceExcerpts.map((e, index) => `${index + 1}. ${na(e)}`)
        : ["1. Not available"];

    const remediationStep = reco !== "Not available" ? reco : "Apply remediation per team standards.";
    const descriptionLines = [`Severity: ${severity}`];

    if (trustLine !== null) {
      descriptionLines.push(`Trust label: ${trustLine}`);
    }

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
      "1. Review the finding in ArchLucid using the inspector link below.",
      `2. ${remediationStep}`,
      "",
      `ArchLucid inspector link: ${inspectUrl}`,
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
    `- ArchLucid run: ${base}`,
    `- Finding (explain page): ${explainUrl}`,
    `- Structured inspector: ${inspectUrl}`,
  );

  return markdownLines.join("\n");
}
