import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import {
  findingTrustExportJsonFields,
  formatFindingTrustExportLine,
} from "@/lib/findings/finding-trust-export";
import {
  findingWorkItemDefaultTitle,
  findingWorkItemHeading,
  findingWorkItemInspectorLinkLabel,
  findingWorkItemReviewLinkLabel,
} from "@/lib/finding-work-item-product-copy";

import {
  na,
  type FindingWorkItemJsonDocument,
  type TraceRowWorkItemInput,
  type WorkItemClipboardFormat,
} from "./copy-finding-as-work-item-types";
import { resolveFindingWorkItemCoverageHonestyFromInput } from "./copy-finding-as-work-item-coverage-honesty";

function traceRowCoverageHonestyLineForExport(input: TraceRowWorkItemInput): string | null {
  if (input.includeCoverageHonesty === false) {
    return null;
  }

  const resolved = resolveFindingWorkItemCoverageHonestyFromInput({
    runId: input.runId,
    findingId: input.findingId,
    siteOrigin: input.siteOrigin,
    severityLabel: input.severityLabel,
    categoryLabel: null,
    impactedAreaLabel: null,
    title: input.findingTitle,
    description: null,
    recommendedAction: input.recommendedAction,
    decisionRuleId: input.ruleId,
    decisionRuleName: null,
    evidenceExcerpts: [],
    trustLabel: input.trustLabel ?? null,
    trustLabelReason: input.trustLabelReason ?? null,
    coverageHonestyLine: input.coverageHonestyLine ?? null,
    includeCoverageHonesty: input.includeCoverageHonesty,
    productLineId: input.productLineId,
  });

  return resolved?.line ?? null;
}

function traceRowWorkItemLinks(input: TraceRowWorkItemInput): {
  origin: string;
  runUrl: string;
  findingUrl: string;
  inspectUrl: string;
} {
  const origin = input.siteOrigin.replace(/\/$/, "");
  const runPath = `/architecture/reviews/${encodeURIComponent(input.runId)}`;
  const findingPath = `${runPath}/findings/${encodeURIComponent(input.findingId)}`;
  const tracePath = getFindingEvidenceTraceHref(input.runId, input.findingId);

  return {
    origin,
    runUrl: `${origin}${runPath}`,
    findingUrl: `${origin}${findingPath}`,
    inspectUrl: `${origin}${tracePath}`,
  };
}

function buildTraceRowWorkItemJsonDocument(input: TraceRowWorkItemInput): FindingWorkItemJsonDocument {
  const links = traceRowWorkItemLinks(input);
  const trustFields = findingTrustExportJsonFields(input);
  const coverageHonestyLine = traceRowCoverageHonestyLineForExport(input);

  return {
    schema: "archlucid.work-item.v1",
    findingId: input.findingId,
    runId: input.runId,
    title: na(input.findingTitle),
    severity: na(input.severityLabel),
    recommendedAction: na(input.recommendedAction),
    status: na(input.statusLabel),
    ruleId: na(input.ruleId),
    ...trustFields,
    ...(coverageHonestyLine !== null ? { coverageHonesty: coverageHonestyLine } : {}),
    links: {
      review: links.runUrl,
      finding: links.findingUrl,
      inspect: links.inspectUrl,
    },
  };
}

/** Builds pasted text for queue rows and aggregate explanation tables. */
export function buildTraceRowWorkItemBody(format: WorkItemClipboardFormat, input: TraceRowWorkItemInput): string {
  const links = traceRowWorkItemLinks(input);
  const title = na(input.findingTitle);
  const severity = na(input.severityLabel);
  const reco = na(input.recommendedAction);
  const status = na(input.statusLabel);
  const rule = na(input.ruleId);
  const trustLine = formatFindingTrustExportLine(input);
  const coverageHonestyLine = traceRowCoverageHonestyLineForExport(input);

  if (format === "json") {
    return JSON.stringify(buildTraceRowWorkItemJsonDocument(input), null, 2);
  }

  if (format === "jiraWiki") {
    const lines = [
      `h2. ${findingWorkItemHeading(input.productLineId, title)}`,
      "",
      `*Finding ID:* {{${input.findingId}}}`,
      "",
      `*Severity:* ${severity}`,
      `*Status:* ${status}`,
      `*Rule id:* ${rule}`,
    ];

    if (trustLine !== null) {
      lines.push(`*Trust label:* ${trustLine}`);
    }

    if (coverageHonestyLine !== null) {
      lines.push(`*Coverage honesty:* ${coverageHonestyLine}`);
    }

    lines.push(
      "",
      "*Recommended action*",
      reco,
      "",
      "*Links*",
      `* (${links.runUrl}|${findingWorkItemReviewLinkLabel(input.productLineId)})`,
      `* (${links.findingUrl}|Finding — explain page)`,
      `* (${links.inspectUrl}|Structured inspector — Why?)`,
    );

    return lines.join("\n");
  }

  if (format === "serviceNowText") {
    const remediationStep = reco !== "Not available" ? reco : "Apply remediation per team standards.";
    const descriptionLines = [
      `Severity: ${severity}`,
      `Status: ${status}`,
    ];

    if (trustLine !== null) {
      descriptionLines.push(`Trust label: ${trustLine}`);
    }

    if (coverageHonestyLine !== null) {
      descriptionLines.push(`Coverage honesty: ${coverageHonestyLine}`);
    }

    return [
      `Short description: ${findingWorkItemDefaultTitle(input.productLineId)} — ${title} (${input.findingId})`,
      "",
      "Description:",
      ...descriptionLines,
      "",
      "Recommended action:",
      reco,
      "",
      "Steps to resolve:",
      "1. Open the structured inspector link below.",
      `2. ${remediationStep}`,
      "",
      `${findingWorkItemInspectorLinkLabel(input.productLineId)}: ${links.inspectUrl}`,
      `Finding ID: ${input.findingId}`,
      `Run ID: ${input.runId}`,
    ].join("\n");
  }

  const markdownLines = [
    "## Finding: " + title,
    "",
    "**Severity:** " + severity,
    "**Status:** " + status,
    "**Finding ID:** `" + input.findingId + "`",
    "**Run:** `" + input.runId + "`",
    "**Rule id:** " + rule,
  ];

  if (trustLine !== null) {
    markdownLines.push("**Trust label:** " + trustLine);
  }

  if (coverageHonestyLine !== null) {
    markdownLines.push("**Coverage honesty:** " + coverageHonestyLine);
  }

  markdownLines.push(
    "",
    "### Recommended action",
    reco,
    "",
    "### Links",
    `- ${findingWorkItemReviewLinkLabel(input.productLineId)}: ${links.runUrl}`,
    `- Finding (explain page): ${links.findingUrl}`,
    `- Structured inspector: ${links.inspectUrl}`,
  );

  return markdownLines.join("\n");
}
