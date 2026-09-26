import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { REVIEWS_HUB_CLAIM_DISCIPLINE } from "@/lib/reviews-hub-evidence-copy";
import {
  resolveSystemNotJobReviewsHubClaimDiscipline,
  SYSTEM_NOT_JOB_REVIEWS_HUB_INBOX_DOC_ANCHOR,
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_CLAIM_DISCIPLINE,
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION,
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_OPEN_ARCHITECTURES_LABEL,
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_SUBTITLE,
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_TITLE,
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_RECENT_EMPTY_BODY,
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY,
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY,
} from "@/lib/system-not-job-reviews-hub-inbox-copy";

const repoRoot = join(__dirname, "..", "..", "..");

describe("SN-011 reviews hub inbox copy", () => {
  it("frames Working hub as cross-architecture inbox with desk resume", () => {
    expect(SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_TITLE).toBe("Reviews");
    expect(SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("cross-architecture");
    expect(SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("architectures");
    expect(SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_SUBTITLE).toContain("Alt+R");
    expect(SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION.toLowerCase()).toContain("triage");
    expect(SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION.toLowerCase()).toContain("architectures");
  });

  it("uses Working claim discipline in Working mode and Guided package teaching otherwise", () => {
    expect(resolveSystemNotJobReviewsHubClaimDiscipline(true)).toBe(
      SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_CLAIM_DISCIPLINE,
    );
    expect(resolveSystemNotJobReviewsHubClaimDiscipline(true).toLowerCase()).toContain("monday-morning");
    expect(resolveSystemNotJobReviewsHubClaimDiscipline(false)).toBe(REVIEWS_HUB_CLAIM_DISCIPLINE);
  });

  it("does not use inbox vocabulary on the Working reviews hub surface", () => {
    const hubCopy = [
      SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_TITLE,
      SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_SUBTITLE,
      SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION,
      SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_CLAIM_DISCIPLINE,
      SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_RECENT_EMPTY_BODY,
      SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY,
      SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY,
      SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_OPEN_ARCHITECTURES_LABEL,
    ]
      .join(" ")
      .toLowerCase();

    expect(hubCopy).not.toContain("inbox");
  });

  it("points at ADR 0079 for desk-as-work-surface", () => {
    const adr = readFileSync(join(repoRoot, SYSTEM_NOT_JOB_REVIEWS_HUB_INBOX_DOC_ANCHOR), "utf8");

    expect(adr).toContain("cross-architecture inbox");
    expect(adr).toContain("Alt+R");
  });

  it("reviews-hub-copy re-exports SN-011 Working strings", () => {
    const hubCopy = readFileSync(
      join(
        repoRoot,
        "archlucid-ui",
        "src",
        "app",
        "(operator)",
        "architecture",
        "reviews",
        "_sections",
        "reviews-hub-copy.ts",
      ),
      "utf8",
    );

    expect(hubCopy).toContain("system-not-job-reviews-hub-inbox-copy");
    expect(hubCopy).toContain("SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_SUBTITLE");
  });
});
