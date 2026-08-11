import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ASK_REVIEW_QUESTIONS_TRAFFIC_NOTE,
  ASK_REVIEW_QUESTIONS_TRAFFIC_PATH,
  ASK_REVIEW_QUESTIONS_TRAFFIC_ROW_ID,
  ASK_REVIEW_QUESTIONS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-ask-review-questions";

describe("ui-route-traffic-ask-review-questions (ASK)", () => {
  it("tracks Ask review questions under Core review with grounded Q&A Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ASK_REVIEW_QUESTIONS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ASK_REVIEW_QUESTIONS_TRAFFIC_PATH);
    expect(row?.section).toBe(ASK_REVIEW_QUESTIONS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ASK_REVIEW_QUESTIONS_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
