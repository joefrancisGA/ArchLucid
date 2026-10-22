import { describe, expect, it } from "vitest";

import {
  resolveInspectStoredEvidenceHelpReturnHref,
  resolveInspectStoredEvidenceHelpReturnHrefFromRecentViews,
} from "@/lib/evidence-source-inspect-help-stored-evidence-return";

describe("resolveInspectStoredEvidenceHelpReturnHref", () => {
  it("accepts review evidence tab deep links", () => {
    expect(resolveInspectStoredEvidenceHelpReturnHref("/architecture/reviews/run-1?reviewTab=evidence")).toBe(
      "/architecture/reviews/run-1?reviewTab=evidence",
    );
    expect(resolveInspectStoredEvidenceHelpReturnHref("/architecture/reviews/run-1?tab=evidence")).toBe(
      "/architecture/reviews/run-1?tab=evidence",
    );
    expect(resolveInspectStoredEvidenceHelpReturnHref("/architecture/reviews/run-1#evidence")).toBe(
      "/architecture/reviews/run-1#evidence",
    );
  });

  it("rejects invalid returnTo values", () => {
    expect(resolveInspectStoredEvidenceHelpReturnHref(undefined)).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("https://evil.example/run-1?reviewTab=evidence")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("/architecture/reviews")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("/architecture/reviews/new?reviewTab=evidence")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("/architecture/reviews/run-1?reviewTab=findings")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("/governance/findings")).toBeNull();
  });
});

describe("resolveInspectStoredEvidenceHelpReturnHrefFromRecentViews", () => {
  it("returns the first recent review evidence href", () => {
    expect(
      resolveInspectStoredEvidenceHelpReturnHrefFromRecentViews({
        entries: [
          { href: "/governance/findings" },
          { href: "/architecture/reviews/run-2?reviewTab=evidence" },
        ],
      }),
    ).toBe("/architecture/reviews/run-2?reviewTab=evidence");
  });

  it("returns null when no recent evidence tab visits exist", () => {
    expect(
      resolveInspectStoredEvidenceHelpReturnHrefFromRecentViews({
        entries: [{ href: "/governance/findings" }],
      }),
    ).toBeNull();
  });
});
