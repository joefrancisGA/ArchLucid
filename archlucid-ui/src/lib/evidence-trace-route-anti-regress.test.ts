import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EVIDENCE_TRACE_TRAFFIC_NOTE } from "@/lib/ui-route-traffic-evidence-trace";

const REPO_UI_ROOT = join(process.cwd());
const FINDING_INSPECT_VIEW = join(
  REPO_UI_ROOT,
  "src",
  "app",
  "(operator)",
  "architecture",
  "reviews",
  "[reviewId]",
  "findings",
  "[findingId]",
  "FindingInspectView.tsx",
);
const FINDING_INSPECT_VIEW_TEST = join(
  REPO_UI_ROOT,
  "src",
  "app",
  "(operator)",
  "architecture",
  "reviews",
  "[reviewId]",
  "findings",
  "[findingId]",
  "FindingInspectView.test.tsx",
);
const STICKINESS_PANEL_TEST = join(
  REPO_UI_ROOT,
  "src",
  "app",
  "(operator)",
  "architecture",
  "reviews",
  "[reviewId]",
  "findings",
  "[findingId]",
  "FindingInspectGovernanceStickinessPanel.test.tsx",
);

describe("evidence-trace-route-anti-regress (TB-1830)", () => {
  it("documents ERU workbook regressions guarded by TB-1826 through TB-1829", () => {
    expect(EVIDENCE_TRACE_TRAFFIC_NOTE).toContain("TB-1826-TB-1829");
    expect(EVIDENCE_TRACE_TRAFFIC_NOTE).toContain("Back to finding");
    expect(EVIDENCE_TRACE_TRAFFIC_NOTE).toContain("without self-link");
  });

  it("keeps finding-first ERU chrome and omits footer self-link wiring in FindingInspectView", () => {
    const source = readFileSync(FINDING_INSPECT_VIEW, "utf8");

    expect(source).toContain("data-testid=\"evidence-trace-back-to-finding\"");
    expect(source).toContain("GOVERNANCE_ACTION_REGION_TITLE");
    expect(source).toContain("OPERATOR_TYPOGRAPHY.sectionTitle");
    expect(source).not.toContain("findingIdForInspectLink");
    expect(source).not.toContain("evidence-trace-orientation");
  });

  it("pairs stickiness concurrent-disposition coverage from TB-987 with ERU Vitest bundle", () => {
    const inspectViewTest = readFileSync(FINDING_INSPECT_VIEW_TEST, "utf8");
    const stickinessTest = readFileSync(STICKINESS_PANEL_TEST, "utf8");

    expect(inspectViewTest).toContain("TB-1826");
    expect(inspectViewTest).toContain("evidence-trace-back-to-finding");
    expect(stickinessTest).toContain("TB-987");
  });
});
