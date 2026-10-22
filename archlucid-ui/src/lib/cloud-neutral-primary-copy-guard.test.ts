import { describe, expect, it } from "vitest";

import {
  CLOUD_CAPABILITY_PROVIDER_MAP,
  CLOUD_NEUTRAL_PRIMARY_COPY,
  listCloudNeutralPrimaryCopyViolations,
  WIZARD_CLOUD_PROVIDER_OPTIONS,
} from "@/lib/cloud-neutral-primary-copy";
import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS } from "@/lib/core-pilot-first-review-copy";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { FIRST_WEEK_ROUTE_GUIDANCE } from "@/lib/first-week-route-guidance";
import { WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE } from "@/components/marketing/welcome-marketing-copy";

describe("cloud-neutral-primary-copy guard", () => {
  it("keeps canonical primary copy free of Azure-default bias phrases", () => {
    expect(listCloudNeutralPrimaryCopyViolations()).toEqual([]);
  });

  it("maps generic capabilities to Azure, AWS, and GCP peers", () => {
    expect(CLOUD_CAPABILITY_PROVIDER_MAP.length).toBeGreaterThanOrEqual(8);

    for (const row of CLOUD_CAPABILITY_PROVIDER_MAP) {
      expect(row.azure.length).toBeGreaterThan(0);
      expect(row.aws.length).toBeGreaterThan(0);
      expect(row.gcp.length).toBeGreaterThan(0);
    }
  });

  it("uses equal-weight cloud provider option labels", () => {
    expect(WIZARD_CLOUD_PROVIDER_OPTIONS.none.toLowerCase()).toContain("evidence-only");
    expect(WIZARD_CLOUD_PROVIDER_OPTIONS.azure).not.toMatch(/accelerated|default|v1/i);
    expect(WIZARD_CLOUD_PROVIDER_OPTIONS.aws).not.toMatch(/accelerated|default|v1/i);
    expect(WIZARD_CLOUD_PROVIDER_OPTIONS.gcp).not.toMatch(/accelerated|default|v1/i);
  });

  it("wires primary surfaces to cloud-neutral copy constants", () => {
    expect(REVIEWS_NEW_PAGE_LEAD).toBe(CLOUD_NEUTRAL_PRIMARY_COPY.reviewsNewPageLead);
    expect(CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS[2]).toBe(
      CLOUD_NEUTRAL_PRIMARY_COPY.corePilotFirstSessionInventoryBullet,
    );
    expect(CORE_PILOT_STEPS[3]?.detail).toBe(CLOUD_NEUTRAL_PRIMARY_COPY.corePilotInventoryStepDetail);

    const homeGuidance = FIRST_WEEK_ROUTE_GUIDANCE.home.bridgeCopy.toLowerCase();
    expect(homeGuidance).not.toContain("azure extractor");
    expect(homeGuidance).toContain("evidence-only");
  });

  it("keeps welcome baseline note scoped to documented per-cloud rule coverage", () => {
    expect(WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE).toContain(
      CLOUD_NEUTRAL_PRIMARY_COPY.scopedCloudCoverageClaim,
    );
    expect(WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE.toLowerCase()).not.toMatch(
      /equal depth|identical coverage on every cloud|same rules on aws, azure, and gcp/,
    );
  });
});
