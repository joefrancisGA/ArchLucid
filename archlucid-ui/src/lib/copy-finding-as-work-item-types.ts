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
  /** Committed manifest version from inspect payload when available. */
  manifestVersion?: string | null;
};

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

export function na(value: string | null | undefined): string {
  const t = value?.trim();

  if (t === undefined || t === null || t.length === 0) {
    return "Not available";
  }

  return t;
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
