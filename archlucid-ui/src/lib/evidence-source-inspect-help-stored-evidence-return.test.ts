import { describe, expect, it } from "vitest";

import { resolveInspectStoredEvidenceHelpReturnHref } from "@/lib/evidence-source-inspect-help-stored-evidence-return";

describe("evidence-source-inspect-help-stored-evidence-return", () => {
  it("accepts validated same-origin review Evidence tab returnTo values", () => {
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

  it("ignores invalid or non-evidence returnTo values", () => {
    expect(resolveInspectStoredEvidenceHelpReturnHref(undefined)).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("https://evil.example/run-1?reviewTab=evidence")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("/architecture/reviews")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("/architecture/reviews/new?reviewTab=evidence")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("/architecture/reviews/run-1?reviewTab=findings")).toBeNull();
    expect(resolveInspectStoredEvidenceHelpReturnHref("/governance/findings")).toBeNull();
  });
});
