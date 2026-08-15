import { resolveInAppDocHref } from "./in-app-doc-href";

export type ContextualHelpEntry = {
  text: string;
  learnMoreUrl?: string;
};

/**
 * In-app help copy for field-local {@link ContextualHelp} triggers. Major page headings use subtitle
 * text and guidance links instead. `learnMoreUrl` values resolve to in-app `/help/{topic}` routes via
 * {@link toDocsBlobUrl}.
 */
export const contextualHelpByKey: Record<string, ContextualHelpEntry> = {
  "commit-manifest": {
    text: "Finalizing locks the sealed review record and synthesizes artifacts. This is the primary pilot deliverable.",
    learnMoreUrl: "/docs/CORE_PILOT.md#review-states",
  },
  "governance-gate": {
    text: "When enabled, governance approval rules check findings against severity thresholds before allowing finalization.",
    learnMoreUrl:
      "/docs/library/customer-facing/GOVERNANCE_APPROVAL_OPERATOR_GUIDE.md#governance-workflow",
  },
};

/** Accessible name fallbacks when help copy is empty — avoids legacy run-primary aria labels. */
const CONTEXTUAL_HELP_KEY_FALLBACK_LABEL: Partial<Record<string, string>> = {
  "commit-manifest": "finalize review",
  "governance-gate": "governance gate",
};

/** First sentence (or short excerpt) of help copy — used for the trigger's accessible name. */
export function contextualHelpTriggerSummary(text: string, helpKey: string): string {
  if (text.trim().length === 0) {
    return CONTEXTUAL_HELP_KEY_FALLBACK_LABEL[helpKey] ?? helpKey.replace(/-/g, " ");
  }

  const dot = text.indexOf(".");

  if (dot >= 0) {
    return text.slice(0, dot + 1).trim();
  }

  return text.slice(0, 120).trim();
}

/** Accessible name for the ContextualHelp trigger button; `null` when `helpKey` is unknown. */
export function contextualHelpTriggerAriaLabel(helpKey: string): string | null {
  const entry = contextualHelpByKey[helpKey];

  if (entry == null) {
    return null;
  }

  const summary = contextualHelpTriggerSummary(entry.text, helpKey);

  return `Contextual help: ${summary}`;
}

/**
 * Resolves a relative in-repo docs path (e.g. `/docs/CORE_PILOT.md#h`) to an in-app help route.
 */
export function toDocsBlobUrl(learnMoreUrl: string): string {
  return resolveInAppDocHref(learnMoreUrl);
}
