import { getFindingEvidenceTraceHref } from "@/lib/finding-evidence-navigation";
import {
  findingTrustExportJsonFields,
  formatFindingTrustExportLine,
} from "@/lib/finding-trust-export";
export type WorkItemClipboardFormat =
  | "markdown"
  | "jiraWiki"
  | "githubMarkdown"
  | "azureDevOpsMarkdown"
  | "serviceNowText"
  | "json";

/** Stable JSON envelope for external ticketing scripts (not a Jira/ServiceNow API integration). */
export type FindingWorkItemJsonDocument = {
  schema: "archlucid.work-item.v1";
  findingId: string;
  runId: string;
  title: string;
  severity: string;
  recommendedAction: string;
  status: string;
  ruleId: string;
  trustLabel?: string;
  trustLabelReason?: string;
  links: {
    review: string;
    finding: string;
    inspect: string;
  };
};

/** Fields assembled from inspect payload + UI labels for a full finding work item. */
export type FindingWorkItemBuildInput = {
  runId: string;
  findingId: string;
  /** `window.location.origin` in browser; SSR may pass "". */
  siteOrigin: string;
  severityLabel: string | null;
  categoryLabel: string | null;
  impactedAreaLabel: string | null;
  title: string | null;
  description: string | null;
  recommendedAction: string | null;
  decisionRuleId: string | null;
  decisionRuleName: string | null;
  evidenceExcerpts: string[];
  trustLabel?: string | null;
  trustLabelReason?: string | null;
};

function na(value: string | null | undefined): string {
  const t = value?.trim();

  if (t === undefined || t === null || t.length === 0) {
    return "Not available";
  }

  return t;
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

/** Minimal block for per-finding table rows (aggregate explanation list / governance queue). */
export type TraceRowWorkItemInput = {
  runId: string;
  findingId: string;
  findingTitle: string | null;
  severityLabel: string | null;
  recommendedAction: string | null;
  statusLabel: string | null;
  ruleId: string | null;
  siteOrigin: string;
  trustLabel?: string | null;
  trustLabelReason?: string | null;
};

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
      `h2. ArchLucid Finding — ${title}`,
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
      `* (${links.runUrl}|ArchLucid review)`,
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
      `Short description: ArchLucid finding — ${title} (${input.findingId})`,
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
      `ArchLucid inspector link: ${links.inspectUrl}`,
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
    `- ArchLucid review: ${links.runUrl}`,
    `- Finding (explain page): ${links.findingUrl}`,
    `- Structured inspector: ${links.inspectUrl}`,
  );

  return markdownLines.join("\n");
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

export async function writeWorkItemBodyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);

      return true;
    } catch {
      /* fall through */
    }
  }

  try {
    if (typeof document === "undefined") {
      return false;
    }

    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("aria-hidden", "true");
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);

    return ok;
  } catch {
    return false;
  }
}
