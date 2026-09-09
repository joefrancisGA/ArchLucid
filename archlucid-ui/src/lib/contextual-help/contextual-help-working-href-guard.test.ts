import { describe, expect, it } from "vitest";

import { allPageContextualHelpRows } from "@/lib/contextual-help/registry";
import {
  resolveWorkingContextualHelpEntry,
  resolveWorkingContextualHelpHref,
} from "@/lib/contextual-help/resolve-working-contextual-help-entry";
import type { PageContextualHelpAction, PageContextualHelpEntry } from "@/lib/contextual-help/types";
import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { COMPARE_CANONICAL_PATH } from "@/lib/compare-evidence-copy";
import { EVIDENCE_GRAPH_CANONICAL_PATH } from "@/lib/evidence-graph-evidence-copy";

function collectActions(entry: PageContextualHelpEntry): PageContextualHelpAction[] {
  const actions: PageContextualHelpAction[] = [];

  if (entry.whatToDoNextAction !== undefined) {
    actions.push(entry.whatToDoNextAction);
  }

  if (entry.whereToConfigureAction !== undefined) {
    actions.push(entry.whereToConfigureAction);
  }

  return actions;
}

describe("contextual help Working href guard (SY-87)", () => {
  it("remaps peer start-review and bare Insights desk-tool hrefs", () => {
    expect(resolveWorkingContextualHelpHref(REVIEWS_NEW_PATH)).toBe(ARCHITECTURES_NEW_PATH);
    expect(resolveWorkingContextualHelpHref(ASK_REVIEW_QUESTIONS_PATH)).toBe(ARCHITECTURES_LIST_PATH);
    expect(resolveWorkingContextualHelpHref(COMPARE_CANONICAL_PATH)).toBe(ARCHITECTURES_LIST_PATH);
    expect(resolveWorkingContextualHelpHref(EVIDENCE_GRAPH_CANONICAL_PATH)).toBe(ARCHITECTURES_LIST_PATH);
  });

  it("SY-87: Working contextual help rows avoid peer review detail and reviews/new mints in actions", () => {
    for (const row of allPageContextualHelpRows()) {
      const entry = resolveWorkingContextualHelpEntry(row.prefix, row.entry);

      for (const action of collectActions(entry)) {
        expect(action.href, `${row.prefix} → ${action.label}`).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
        expect(action.href, `${row.prefix} → ${action.label}`).not.toBe(REVIEWS_NEW_PATH);
        expect(action.href, `${row.prefix} → ${action.label}`).not.toBe(ASK_REVIEW_QUESTIONS_PATH);
        expect(action.href, `${row.prefix} → ${action.label}`).not.toBe(COMPARE_CANONICAL_PATH);
        expect(action.href, `${row.prefix} → ${action.label}`).not.toBe(EVIDENCE_GRAPH_CANONICAL_PATH);
      }
    }
  });

  it("uses Inbox and architecture desk labels on getting-started help", () => {
    const entry = resolveWorkingContextualHelpEntry(
      "/help/getting-started",
      allPageContextualHelpRows().find((row) => row.prefix === "/help/getting-started")!.entry,
    );

    expect(entry.whatToDoNextAction?.href).toBe(ARCHITECTURES_NEW_PATH);
    expect(entry.whereToConfigureAction?.label).toBe("Inbox");
    expect(entry.taskSteps?.join(" ")).toContain("Inbox");
  });
});
