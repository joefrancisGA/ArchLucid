import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES } from "@/lib/operator/operator-governance-sponsor-page-help-surfaces";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const SRC_ROOT = join(process.cwd(), "src");

function readSrcModule(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), "utf8");
}

describe("operator-governance-sponsor-page-help-surfaces (TB-1668)", () => {
  it("tracks every TB-1668 named surface", () => {
    expect(OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES.map((entry) => entry.id)).toEqual([
      "governance-workflow",
      "governance-setup",
      "governance-exceptions",
      "governance-policy-packs",
      "governance-standards-rules",
      "governance-decision-register",
      "governance-audit",
      "governance-recurrence-schedules",
      "governance-findings",
      "governance-alerts",
      "governance-alert-rules",
      "governance-advisory-scans",
      "sponsor-executive-summary",
      "sponsor-pilot-outcomes",
      "sponsor-roi-summary",
    ]);
  });

  it.each(
    OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES.map((entry) => [
      entry.id,
      entry.pathname,
      entry.modulePath,
    ]),
  )("%s resolves a page help topic for %s", (_id, pathname) => {
    const topic = pageHelpTopicForPathname(pathname);

    expect(topic).not.toBeNull();
    expect(topic?.label?.length).toBeGreaterThan(0);
  });

  it.each(
    OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES.map((entry) => [
      entry.id,
      entry.modulePath,
    ]),
  )("%s mounts PageContextualHelpButton", (_id, modulePath) => {
    const source = readSrcModule(modulePath);

    expect(source).toContain("PageContextualHelpButton");
  });

  it("alerts hub maps to alerts, not governance-approval (TB-1668)", () => {
    expect(pageHelpTopicForPathname("/governance/alerts")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance")?.slug).toBe("governance-approval");
  });

  it("governance setup and recurrence schedules map to honest topics (TB-1668)", () => {
    expect(pageHelpTopicForPathname("/governance/setup")?.slug).toBe("governance-approval");
    expect(pageHelpTopicForPathname("/governance/recurrence-schedules")?.slug).toBe("recurrence-schedules");
    expect(pageHelpTopicForPathname("/insights/roi-summary")?.slug).toBe("roi-summary");
    expect(pageHelpTopicForPathname("/governance/exceptions")?.slug).toBe("governance-approval");
  });
});
