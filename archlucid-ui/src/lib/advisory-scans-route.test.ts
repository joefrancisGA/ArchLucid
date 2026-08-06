import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildAdvisoryHubHref } from "@/lib/advisory-hub-href";
import {
  ADVISORY_SCANS_HREF,
  ADVISORY_SCANS_SCHEDULES_HREF,
} from "@/lib/advisory-scans-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const ADVISORY_SCANS_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "governance",
  "advisory-scans",
  "page.tsx",
);
const ADVISORY_HUB_CLIENT = join(process.cwd(), "src", "components", "advisory", "AdvisoryHubClient.tsx");

const PRODUCT_ADVISORY_SCHEDULES_TAB_SURFACES = [
  "archlucid-ui/src/lib/digest-subscriptions-workflow.ts",
  "archlucid-ui/src/lib/digest-setup-gap-actions.ts",
  "archlucid-ui/src/components/digests/WeeklyDigestHealthBanner.tsx",
  "archlucid-ui/src/components/digests/ExecDigestScheduleContent.tsx",
] as const;

const CANONICAL_ADVISORY_SCHEDULES_TAB_HANDOFF_MARKERS = [
  ADVISORY_SCANS_SCHEDULES_HREF,
  "ADVISORY_SCANS_SCHEDULES_HREF",
] as const;

function expectCanonicalAdvisorySchedulesTabHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_ADVISORY_SCHEDULES_TAB_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("advisory-scans-route", () => {
  it("exposes the Governance-canonical Advisory scans paths (TB-1124)", () => {
    expect(ADVISORY_SCANS_HREF).toBe("/governance/advisory-scans");
    expect(ADVISORY_SCANS_SCHEDULES_HREF).toBe("/governance/advisory-scans?tab=schedules");
  });
});

describe("advisory-scans-schedules-tab-route (AD)", () => {
  it("resolves the Schedules tab on the server shell and AdvisoryHubClient", () => {
    const pageSource = readFileSync(ADVISORY_SCANS_PAGE, "utf8");
    const hubSource = readFileSync(ADVISORY_HUB_CLIENT, "utf8");

    expect(pageSource).toContain("advisoryHubTabFromSearchParam");
    expect(pageSource).toContain("AdvisoryHubClient");
    expect(hubSource).toContain("AdvisorySchedulesContent");
    expect(hubSource).toContain('schedules: "Schedules"');
    expect(hubSource).toContain("buildAdvisoryHubHref");
  });

  it("keeps marketing sitemap inventory off the advisory-scans hub path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(ADVISORY_SCANS_HREF);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(ADVISORY_SCANS_SCHEDULES_HREF);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(ADVISORY_SCANS_HREF);
  });

  it("builds the Schedules tab href from advisory hub navigation helpers", () => {
    expect(buildAdvisoryHubHref({ tab: "schedules" })).toBe(ADVISORY_SCANS_SCHEDULES_HREF);
  });

  it("keeps digest and advisory handoffs on canonical Schedules tab href", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_ADVISORY_SCHEDULES_TAB_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalAdvisorySchedulesTabHandoff(source);
    }
  });
});
