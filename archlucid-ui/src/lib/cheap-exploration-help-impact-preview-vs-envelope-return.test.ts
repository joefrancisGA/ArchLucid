import { describe, expect, it } from "vitest";

import { resolveImpactPreviewVsEnvelopeHelpReturnHref } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-return";

describe("resolveImpactPreviewVsEnvelopeHelpReturnHref", () => {
  it("accepts validated same-origin architecture review desk returnTo values", () => {
    expect(resolveImpactPreviewVsEnvelopeHelpReturnHref("/architecture/reviews/run-1")).toBe(
      "/architecture/reviews/run-1",
    );
    expect(resolveImpactPreviewVsEnvelopeHelpReturnHref("/architecture/reviews/run-1?reviewTab=overview")).toBe(
      "/architecture/reviews/run-1?reviewTab=overview",
    );
  });

  it("ignores invalid or non-desk returnTo values", () => {
    expect(resolveImpactPreviewVsEnvelopeHelpReturnHref(undefined)).toBeNull();
    expect(resolveImpactPreviewVsEnvelopeHelpReturnHref("")).toBeNull();
    expect(resolveImpactPreviewVsEnvelopeHelpReturnHref("https://evil.example/run-1")).toBeNull();
    expect(resolveImpactPreviewVsEnvelopeHelpReturnHref("/architecture/reviews")).toBeNull();
    expect(resolveImpactPreviewVsEnvelopeHelpReturnHref("/architecture/reviews/new")).toBeNull();
    expect(resolveImpactPreviewVsEnvelopeHelpReturnHref("/insights/impact-preview")).toBeNull();
    expect(resolveImpactPreviewVsEnvelopeHelpReturnHref("/governance/findings")).toBeNull();
  });
});
