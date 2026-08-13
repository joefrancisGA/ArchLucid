import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { CORE_PILOT_STEP_COUNT, CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";

describe("core-pilot-steps", () => {
  it("keeps CORE_PILOT_STEP_COUNT aligned with the checklist array", () => {
    expect(CORE_PILOT_STEPS).toHaveLength(CORE_PILOT_STEP_COUNT);
    expect(CORE_PILOT_STEP_COUNT).toBe(7);
  });

  it("starts with demo or new-request path on /architecture/reviews/new", () => {
    const firstStep = CORE_PILOT_STEPS[0];

    expect(firstStep.title.toLowerCase()).toContain("demo");
    expect(firstStep.primaryHref).toBe("/architecture/reviews/new");
  });

  it("includes upload, dashboard ROI, and audit export steps", () => {
    const hrefs = CORE_PILOT_STEPS.map((step) => step.primaryHref);

    expect(hrefs).toContain("/administration/extract-upload");
    expect(hrefs).toContain(SPONSOR_DASHBOARD_HREF);
    expect(CORE_PILOT_STEPS.some((step) => step.title.toLowerCase().includes("audit"))).toBe(true);
  });

  it("uses multi-cloud inventory language on step 4 upload guidance", () => {
    const uploadStep = CORE_PILOT_STEPS[3];

    expect(uploadStep.title).toBe("Upload cloud inventory evidence");
    expect(uploadStep.shortBody).toBe(
      "Optional for document/brief-only reviews — cloud inventory required for cost ROI accuracy.",
    );
    expect(uploadStep.detail).toContain("brief, document, or diagram evidence only");
    expect(uploadStep.primaryLabel).toBe("Upload inventory ZIP");
    expect(uploadStep.primaryHref).toBe("/administration/extract-upload");
  });

  it("keeps default-visible shortBody lines free of manifest jargon (detail may stay technical)", () => {
    for (const step of CORE_PILOT_STEPS) {
      expect(step.shortBody.toLowerCase()).not.toContain("manifest");
    }

    expect(
      CORE_PILOT_STEPS.filter((s) => (s.detail ?? "").toLowerCase().includes("signed review")).length,
    ).toBeGreaterThan(0);
  });
});
