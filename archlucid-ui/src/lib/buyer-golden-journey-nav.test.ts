import { describe, expect, it } from "vitest";

import { getShowcaseExecutiveHref, getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";

import {
  BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS,
  resolveBuyerGoldenJourneyNav,
} from "@/lib/buyer-golden-journey-nav";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("resolveBuyerGoldenJourneyNav", () => {
  it("returns null for unrelated routes", () => {
    expect(resolveBuyerGoldenJourneyNav("/policy-packs")).toBeNull();
    expect(resolveBuyerGoldenJourneyNav("/reviews/other-run")).toBeNull();
  });

  it("resolves executive summary as step 1 with next manifest only", () => {
    const path = getShowcaseExecutiveHref();
    const nav = resolveBuyerGoldenJourneyNav(path);

    expect(nav?.summaryLine).toContain("Step 1 of 5");
    expect(nav?.summaryLine).toContain("Executive Summary");
    expect(nav?.prev).toBeNull();
    expect(nav?.next?.label).toBe("Signed manifest");
    expect(nav?.next?.href).toBe(getShowcaseManifestHref());
  });

  it("resolves signed manifest path and manifest record id", () => {
    const viaReview = getShowcaseManifestHref();
    const viaManifests = `/manifests/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`;

    const navA = resolveBuyerGoldenJourneyNav(viaReview);
    const navB = resolveBuyerGoldenJourneyNav(viaManifests);

    expect(navA?.summaryLine).toContain("Step 2 of 5");
    expect(navB?.summaryLine).toContain("Step 2 of 5");
    expect(navA?.prev?.label).toBe("Executive Summary");
    expect(navA?.next?.label).toBe("Evidence graph");
  });

  it("resolves graph governance and audit sequence", () => {
    const graph = resolveBuyerGoldenJourneyNav("/graph");
    expect(graph?.summaryLine).toContain("Step 3 of 5");
    expect(graph?.prev?.label).toBe("Signed manifest");
    expect(graph?.next?.label).toBe("Governance approval");

    const gov = resolveBuyerGoldenJourneyNav("/governance");
    expect(gov?.summaryLine).toContain("Step 4 of 5");

    const audit = resolveBuyerGoldenJourneyNav("/audit");
    expect(audit?.summaryLine).toContain("Step 5 of 5");
    expect(audit?.next).toBeNull();
  });

  it("treats showcase review workspace as hub between executive and manifest", () => {
    const nav = resolveBuyerGoldenJourneyNav(`/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`);

    expect(nav?.summaryLine).toContain("Review package overview");
    expect(nav?.prev?.href).toBe(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0].href);
    expect(nav?.next?.href).toBe(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[1].href);
  });
});
