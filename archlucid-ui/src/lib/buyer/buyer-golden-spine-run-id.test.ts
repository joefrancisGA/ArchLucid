import { describe, expect, it } from "vitest";

import {
  isBuyerGoldenReviewPackagePageReady,
  isBuyerGoldenSpineRunId,
} from "@/lib/buyer/buyer-golden-spine-run-id";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("buyer-golden-spine-run-id", () => {
  it("treats showcase static and pinned demo workspace runs as golden spine ids", () => {
    expect(isBuyerGoldenSpineRunId(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(true);
    expect(isBuyerGoldenSpineRunId("customer-intake-modernization-run")).toBe(true);
    expect(isBuyerGoldenSpineRunId("b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf")).toBe(true);
    expect(isBuyerGoldenSpineRunId("61c60d76-2b80-93f9-46bb-2f66fd608b9b")).toBe(true);
  });

  it("rejects unrelated run ids", () => {
    expect(isBuyerGoldenSpineRunId("")).toBe(false);
    expect(isBuyerGoldenSpineRunId("claims-intake-run-v1")).toBe(false);
    expect(isBuyerGoldenSpineRunId("00000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("marks buyer golden page ready when polished spine run has headline and manifest", () => {
    expect(
      isBuyerGoldenReviewPackagePageReady({
        buyerPolishedArtifactTable: true,
        runId: "b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf",
        headline: "Contoso Product Tour Review Package",
        manifestId: "manifest-1",
      }),
    ).toBe(true);
  });

  it("requires buyer-polished shell, headline, and manifest for golden page ready", () => {
    const base = {
      buyerPolishedArtifactTable: true,
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      headline: "Enterprise Customer Intake Modernization Review Package",
      manifestId: "manifest-1",
    } as const;

    expect(isBuyerGoldenReviewPackagePageReady(base)).toBe(true);
    expect(isBuyerGoldenReviewPackagePageReady({ ...base, buyerPolishedArtifactTable: false })).toBe(false);
    expect(isBuyerGoldenReviewPackagePageReady({ ...base, headline: "  " })).toBe(false);
    expect(isBuyerGoldenReviewPackagePageReady({ ...base, manifestId: null })).toBe(false);
    expect(isBuyerGoldenReviewPackagePageReady({ ...base, runId: "other-run" })).toBe(false);
  });
});
