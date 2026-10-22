import { describe, expect, it } from "vitest";

import {
  REPORT_PROBLEM_ACKNOWLEDGEMENT_TEMPLATE,
  REPORT_PROBLEM_CONSENT_LABEL,
  formatReportProblemAcknowledgement,
} from "@/lib/report-problem-copy";

describe("report-problem-copy (TB-782)", () => {
  it("formats acknowledgement with reference id per owner SLA", () => {
    expect(formatReportProblemAcknowledgement("PR-2026-00042")).toBe(
      "We received your report (reference PR-2026-00042). We'll respond by the next business day.",
    );
  });

  it("keeps canonical SLA template token for email ack reuse", () => {
    expect(REPORT_PROBLEM_ACKNOWLEDGEMENT_TEMPLATE).toContain("{id}");
    expect(REPORT_PROBLEM_ACKNOWLEDGEMENT_TEMPLATE).toContain("next business day");
  });

  it("states consent without implying auto log attach", () => {
    expect(REPORT_PROBLEM_CONSENT_LABEL).toMatch(/do not attach client log/i);
    expect(REPORT_PROBLEM_CONSENT_LABEL).toMatch(/redacted support bundle/i);
  });
});
