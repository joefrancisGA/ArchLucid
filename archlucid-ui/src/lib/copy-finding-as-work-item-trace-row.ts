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
