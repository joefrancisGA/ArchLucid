import { describe, expect, it } from "vitest";

import {
  TROUBLESHOOTING_ADVANCED_DIAGNOSTICS_ITEMS,
  TROUBLESHOOTING_COMMON_ISSUES,
  TROUBLESHOOTING_DECISION_TREE_STEPS,
  TROUBLESHOOTING_PRIMARY_ACTIONS,
  TROUBLESHOOTING_REPORT_PROBLEM_LINK,
} from "@/lib/troubleshooting-help-guide-content";

const ENG_RUNBOOK_HREF_MARKERS = [
  "developer-troubleshooting",
  "engineering-troubleshooting",
] as const;

function collectCustomerTroubleshootingHrefs(): string[] {
  const hrefs: string[] = [
    TROUBLESHOOTING_PRIMARY_ACTIONS.systemHealth.href,
    TROUBLESHOOTING_PRIMARY_ACTIONS.reportProblem.href,
    TROUBLESHOOTING_PRIMARY_ACTIONS.contactSupport.href,
    TROUBLESHOOTING_REPORT_PROBLEM_LINK.href,
    ...TROUBLESHOOTING_ADVANCED_DIAGNOSTICS_ITEMS.map((item) => item.href),
  ];

  for (const issue of TROUBLESHOOTING_COMMON_ISSUES) {
    for (const link of issue.nextSteps) {
      hrefs.push(link.href);
    }
  }

  for (const step of TROUBLESHOOTING_DECISION_TREE_STEPS) {
    for (const branch of step.branches) {
      hrefs.push(branch.href);
    }
  }

  return hrefs;
}

describe("troubleshooting-help-guide-content", () => {
  it("routes Support reference for tickets to Report a problem (TB-1249)", () => {
    const supportReference = TROUBLESHOOTING_ADVANCED_DIAGNOSTICS_ITEMS.find(
      (item) => item.title === "Support reference for tickets",
    );

    expect(supportReference).toBeDefined();
    expect(supportReference!.href).toBe("/help/report-a-problem");
    expect(supportReference!.linkLabel).toBe("Report a problem");
    expect(supportReference!.adminOnly).toBeUndefined();
  });

  it("never deep-links the engineering runbook from customer troubleshooting content (TB-1249)", () => {
    const hrefs = collectCustomerTroubleshootingHrefs();

    for (const href of hrefs) {
      const lower = href.toLowerCase();

      for (const marker of ENG_RUNBOOK_HREF_MARKERS) {
        expect(lower, href).not.toContain(marker);
      }
    }
  });
});
