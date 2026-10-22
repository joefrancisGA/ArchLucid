import { describe, expect, it } from "vitest";

import {
  filterTroubleshootingIssues,
  groupTroubleshootingIssuesByKind,
} from "@/lib/troubleshooting-common-issues-triage";
import { TROUBLESHOOTING_COMMON_ISSUES } from "@/lib/troubleshooting-help-guide-content";

describe("troubleshooting-common-issues-triage", () => {
  it("keeps access blockers in the first three positions", () => {
    expect(TROUBLESHOOTING_COMMON_ISSUES.slice(0, 3).map((issue) => issue.id)).toEqual([
      "organization-sso-required",
      "email-code-sign-in-failed",
      "permissions-or-sign-in-issue",
    ]);
  });

  it("filters issues by sign-in wording", () => {
    const filtered = filterTroubleshootingIssues(TROUBLESHOOTING_COMMON_ISSUES, "sign in");

    expect(filtered.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(["organization-sso-required", "email-code-sign-in-failed", "permissions-or-sign-in-issue"]),
    );
    expect(filtered.some((issue) => issue.id === "findings-count-wrong")).toBe(false);
  });

  it("groups by owner kind in stable order", () => {
    const groups = groupTroubleshootingIssuesByKind(TROUBLESHOOTING_COMMON_ISSUES);

    expect(groups.map((group) => group.kind)).toEqual(["user-fixable", "workspace-admin"]);
    expect(groups[0]?.issues[0]?.id).toBe("organization-sso-required");
  });
});
