import { describe, expect, it } from "vitest";

import {
  ENGINEERING_TROUBLESHOOTING_HELP_CANONICAL_PATH,
  ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_INTRO,
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS,
} from "@/lib/engineering-troubleshooting-help-guide-content";

describe("engineering-troubleshooting-help-guide-content", () => {
  it("keeps primary CTAs on customer troubleshooting, system health, report-a-problem, and CLI", () => {
    expect(ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.href).toBe(
      "/help/troubleshooting",
    );
    expect(ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openSystemHealth.href).toBe(
      "/administration/system-health",
    );
    expect(ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openReportAProblem.href).toBe(
      "/help/report-a-problem",
    );
    expect(ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCliUsage.href).toBe("/help/cli-usage");
  });

  it("lists Sources without a self-link to this eng runbook", () => {
    expect(
      ENGINEERING_TROUBLESHOOTING_HELP_SOURCES.some(
        (link) => link.href === ENGINEERING_TROUBLESHOOTING_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
    expect(ENGINEERING_TROUBLESHOOTING_HELP_SOURCES.some((link) => link.href.includes("troubleshooting"))).toBe(
      true,
    );
  });

  it("links every symptom escalation artifact to an in-app destination", () => {
    for (const row of ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS) {
      expect(row.escalationHref, row.symptom).toBeDefined();
      expect(row.escalationHref, row.symptom).toMatch(/^\//);
    }
  });

  it("states claim discipline without implying certification", () => {
    expect(ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not customer");
    expect(ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
  });

  it("names admin-diagnostics and configuration-reference in the Sources strip intro", () => {
    expect(ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_INTRO.toLowerCase()).toContain("admin diagnostics");
    expect(ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_INTRO.toLowerCase()).toContain("configuration reference");
  });
});
