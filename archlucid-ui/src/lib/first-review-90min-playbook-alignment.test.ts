import { describe, expect, it } from "vitest";

import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import {
  BUYER_FIRST_REVIEW_HELP_HREF,
  FIRST_REVIEW_90MIN_CHECKLIST_KEYWORDS,
  FIRST_REVIEW_90MIN_HELP_HREF,
  FIRST_REVIEW_90MIN_REQUIRED_ROUTES,
  FIRST_RUN_EVIDENCE_CHECKLIST_DOC_PATH,
} from "@/lib/first-review-90min-playbook-alignment";
import { getFoldedInternalRunbookEntry } from "@/lib/folded-internal-runbook-help";

describe("first-review 90-minute playbook alignment", () => {
  it("registers first-review folded runbook against the first-run evidence checklist doc", () => {
    const entry = getFoldedInternalRunbookEntry("first-review");

    expect(entry).not.toBeNull();
    expect(entry?.sourcePaths[0]).toBe(FIRST_RUN_EVIDENCE_CHECKLIST_DOC_PATH);
    expect(entry?.contentKind).toBe("internal-runbook");
    expect(FIRST_REVIEW_90MIN_HELP_HREF).toBe(
      "/help/first-architecture-review#printable-first-run-evidence-checklist",
    );
    expect(BUYER_FIRST_REVIEW_HELP_HREF).toBe("/help/first-architecture-review");
  });

  it("links checklist steps to required operator routes", () => {
    const hrefs = CORE_PILOT_STEPS.map((step) => step.primaryHref);

    for (const route of FIRST_REVIEW_90MIN_REQUIRED_ROUTES) {
      expect(hrefs.some((href) => href.startsWith(route))).toBe(true);
    }
  });

  it("covers upload, finalize, ROI, and audit proof keywords in step copy", () => {
    const combined = CORE_PILOT_STEPS.map((step) => `${step.title} ${step.shortBody} ${step.detail ?? ""}`)
      .join(" ")
      .toLowerCase();

    for (const keyword of FIRST_REVIEW_90MIN_CHECKLIST_KEYWORDS) {
      expect(combined, `missing "${keyword}"`).toContain(keyword);
    }
  });
});
