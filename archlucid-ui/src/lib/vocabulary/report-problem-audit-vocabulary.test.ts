import { describe, expect, it } from "vitest";

import {
  REPORT_PROBLEM_AUDIT_AUDIT_LINK,
  REPORT_PROBLEM_AUDIT_COMPACT_LINE,
  REPORT_PROBLEM_AUDIT_HEADING,
  REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK,
  REPORT_PROBLEM_AUDIT_WHY_TWO,
  buildReportProblemAuditVocabulary,
  resolveReportProblemAuditPeerLink,
} from "@/lib/vocabulary/report-problem-audit-vocabulary";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";

describe("report-problem-audit-vocabulary (TB-2267)", () => {
  it("explains report-a-problem support intake vs governance audit trail", () => {
    const model = buildReportProblemAuditVocabulary();

    expect(model.heading).toBe(REPORT_PROBLEM_AUDIT_HEADING);
    expect(model.heading.toLowerCase()).toContain("report a problem");
    expect(model.heading.toLowerCase()).toContain("audit");
    expect(model.whyTwo).toBe(REPORT_PROBLEM_AUDIT_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("support intake");
    expect(model.whyTwo.toLowerCase()).toContain("audit trail");
    expect(model.whyTwo.toLowerCase()).not.toContain("activity log");
    expect(model.compactLine).toBe(REPORT_PROBLEM_AUDIT_COMPACT_LINE);
    expect(model.compactLine.toLowerCase()).not.toContain("activity log");

    expect(model.reportProblemLink).toEqual(REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK);
    expect(model.reportProblemLink.href).toBe(SUPPORT_REPORT_PROBLEM_HELP_HREF);
    expect(model.reportProblemLink.href).toBe("/help/report-a-problem");

    expect(model.auditLink).toEqual(REPORT_PROBLEM_AUDIT_AUDIT_LINK);
    expect(model.auditLink.href).toBe(GOVERNANCE_AUDIT_PATH);
    expect(model.auditLink.href).toBe("/governance/audit");
  });

  it("resolves the peer surface from report-problem and audit", () => {
    expect(resolveReportProblemAuditPeerLink("report-problem")).toEqual(
      REPORT_PROBLEM_AUDIT_AUDIT_LINK,
    );
    expect(resolveReportProblemAuditPeerLink("audit")).toEqual(
      REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK,
    );
  });
});
