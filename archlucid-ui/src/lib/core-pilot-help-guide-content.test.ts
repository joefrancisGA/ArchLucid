import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_HELP_CLOUD_ACTIONS,
  CORE_PILOT_HELP_DISCLOSURE,
  CORE_PILOT_HELP_DEPTH_GUIDES,
  CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TEST_ID,
  CORE_PILOT_HELP_FIRST_VIEWPORT_STEPS,
  CORE_PILOT_HELP_GUIDE_HEADINGS,
  CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL,
  CORE_PILOT_HELP_OPTIONAL_PATHS_TITLE,
  CORE_PILOT_HELP_PRIMARY_ACTIONS,
  CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL,
  CORE_PILOT_HELP_START_REVIEW_HREF,
  CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS,
  CORE_PILOT_HELP_WORKFLOW_STEPS,
} from "@/lib/core-pilot-help-guide-content";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("core-pilot-help-guide-content sample CTA (TB-1332)", () => {
  it("names the Customer Intake showcase on the sample review CTA", () => {
    expect(CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL.toLowerCase()).toContain("customer");
    expect(CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL).toContain(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
    expect(CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL).not.toBe("Open sample review");
    expect(CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.href).toBe(
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    );
    expect(CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.label).toBe(CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL);
  });

  it("TB-1334: keeps post-stepper IA to one optional cluster heading", () => {
    const headingIds = CORE_PILOT_HELP_GUIDE_HEADINGS.map((heading) => heading.id);

    expect(headingIds).toContain("optional-paths");
    expect(headingIds).not.toContain("cloud-connectors-optional");
    expect(headingIds).not.toContain("fast-path-evidence-only");
    expect(headingIds).not.toContain("what-can-wait");
    expect(CORE_PILOT_HELP_OPTIONAL_PATHS_TITLE.toLowerCase()).toContain("optional");
  });

  it("TB-1335: uses distinct related-guide labels", () => {
    const labels = CORE_PILOT_HELP_DEPTH_GUIDES.map((guide) => guide.label);

    expect(labels).toContain(CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL);
    expect(labels.some((label) => /first review guide/i.test(label))).toBe(false);
  });

  it("TB-1333: exposes neutral workflow checking copy", () => {
    expect(CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS.toLowerCase()).toContain("checking workspace");
  });

  it("TB-1684: keeps buyer start path on /architecture/reviews/new — extract-upload is not a sole CTA", () => {
    const step2 = CORE_PILOT_HELP_WORKFLOW_STEPS[1]!;

    expect(step2.href).toBe(CORE_PILOT_HELP_START_REVIEW_HREF);
    expect(step2.ctaLabel).toBe("Start a review to add evidence");

    const evidenceOnlyCard = CORE_PILOT_HELP_CLOUD_ACTIONS.find((action) => action.title === "Evidence-only review");

    expect(evidenceOnlyCard?.href).toBe(CORE_PILOT_HELP_START_REVIEW_HREF);
    expect(evidenceOnlyCard?.ctaLabel).toBe("Start evidence-only review");

    for (const step of CORE_PILOT_HELP_WORKFLOW_STEPS) {
      expect(step.href).toBe(CORE_PILOT_HELP_START_REVIEW_HREF);
    }

    for (const action of CORE_PILOT_HELP_CLOUD_ACTIONS) {
      expect(action.href).not.toContain("/administration/extract-upload");
    }

    expect(CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.href).toBe(CORE_PILOT_HELP_START_REVIEW_HREF);
  });

  it("TB-1685: exposes three first-viewport job steps before deferred optional paths", () => {
    expect(CORE_PILOT_HELP_FIRST_VIEWPORT_STEPS).toHaveLength(3);
    expect(CORE_PILOT_HELP_FIRST_VIEWPORT_STEPS.map((step) => step.title)).toEqual([
      "Start a review",
      "Add evidence",
      "Finalize and share",
    ]);
    expect(CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TEST_ID).toBe("core-pilot-first-viewport-job-chrome");
  });
});
