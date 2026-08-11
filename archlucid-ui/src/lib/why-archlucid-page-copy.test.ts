import { describe, expect, it } from "vitest";

import {
  WHY_ARCHLUCID_COUNTERS_INTRO,
  WHY_ARCHLUCID_COUNTER_HINT_AUDIT_ROWS,
  WHY_ARCHLUCID_COUNTER_HINT_FINDINGS,
  WHY_ARCHLUCID_COUNTER_HINT_RUNS_CREATED,
  WHY_ARCHLUCID_FOOTER_EXECUTIVE_BRIEF_HREF,
  WHY_ARCHLUCID_FOOTER_GETTING_STARTED_HREF,
  WHY_ARCHLUCID_FOOTER_TRUST_CENTER_HREF,
  WHY_ARCHLUCID_MARKETING_WHY_HREF,
  WHY_ARCHLUCID_PAGE_TITLE,
  whyArchlucidCounterHintAuditRowsTruncated,
  whyArchLucidSampleReviewHref,
} from "@/lib/why-archlucid-page-copy";

const ENGINEERING_LEAK_PATTERNS = [
  /archlucidinstrumentation/i,
  /iauditrepository/i,
  /archlucid_/i,
  /docs\/library/i,
  /docs\/go-to-market/i,
];

describe("why-archlucid-page-copy (TB-1308)", () => {
  it("uses operator language for counter helper copy", () => {
    const values = [
      WHY_ARCHLUCID_COUNTERS_INTRO,
      WHY_ARCHLUCID_COUNTER_HINT_RUNS_CREATED,
      WHY_ARCHLUCID_COUNTER_HINT_AUDIT_ROWS,
      WHY_ARCHLUCID_COUNTER_HINT_FINDINGS,
      whyArchlucidCounterHintAuditRowsTruncated(12),
    ];

    for (const value of values) {
      for (const pattern of ENGINEERING_LEAK_PATTERNS) {
        expect(value).not.toMatch(pattern);
      }
    }
  });

  it("routes footer narrative to in-app buyer surfaces only", () => {
    for (const href of [
      WHY_ARCHLUCID_FOOTER_EXECUTIVE_BRIEF_HREF,
      WHY_ARCHLUCID_FOOTER_GETTING_STARTED_HREF,
      WHY_ARCHLUCID_FOOTER_TRUST_CENTER_HREF,
    ]) {
      expect(href.startsWith("/")).toBe(true);
      expect(href.toLowerCase()).not.toContain("docs/");
    }
  });

  it("TB-1307: page title is not the marketing /why H1 twin", () => {
    expect(WHY_ARCHLUCID_PAGE_TITLE).not.toBe("Why ArchLucid");
    expect(WHY_ARCHLUCID_MARKETING_WHY_HREF).toBe("/why");
  });

  it("TB-1309: sample review href is null without a demo run id", () => {
    expect(whyArchLucidSampleReviewHref(null)).toBeNull();
    expect(whyArchLucidSampleReviewHref("  ")).toBeNull();
    expect(whyArchLucidSampleReviewHref("demo-run-1")).toBe("/architecture/reviews/demo-run-1");
  });
});
