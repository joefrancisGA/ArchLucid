import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import { CopyFindingAsWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";

import type { FindingInspectPayload } from "@/types/finding-inspect";

describe("CopyFindingAsWorkItemButton", () => {
  it("uses the primary button treatment so Copy for Jira stays legible on operator surfaces", () => {
    const payload: FindingInspectPayload = {
      findingId: "fid-1",
      typedPayload: {
        severity: "High",
        category: "Cost",
        title: "Over-provisioned",
        description: "Too many SKU.",
      },
      decisionRuleId: "r1",
      decisionRuleName: "SKU check",
      evidence: [{ artifactId: "a", lineRange: "1-2", excerpt: "log" }],
      recommendedActions: [],
      auditRowId: null,
      runId: "run-42",
      manifestVersion: "v9",
    };

    render(<CopyFindingAsWorkItemButton findingId="fid-1" payload={payload} runId="run-42" />);

    const copyForJiraButton = screen.getByTestId("copy-for-jira-button");

    expect(copyForJiraButton).toHaveClass("bg-[var(--al-primary-action-bg)]");
    expect(copyForJiraButton).toHaveClass("text-[var(--al-primary-action-fg)]");
    expect(copyForJiraButton.className).not.toContain("text-neutral-50");
  });

  it("calls clipboard.writeText with Jira wiki body on one-click Copy for Jira", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const payload: FindingInspectPayload = {
      findingId: "fid-1",
      typedPayload: {
        severity: "High",
        category: "Cost",
        title: "Over-provisioned",
        description: "Too many SKU.",
      },
      decisionRuleId: "r1",
      decisionRuleName: "SKU check",
      evidence: [{ artifactId: "a", lineRange: "1-2", excerpt: "log" }],
      recommendedActions: [],
      auditRowId: null,
      runId: "run-42",
      manifestVersion: "v9",
    };

    render(<CopyFindingAsWorkItemButton findingId="fid-1" payload={payload} runId="run-42" />);

    fireEvent.click(screen.getByTestId("copy-for-jira-button"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });

    const body = writeText.mock.calls[0]?.[0] ?? "";

    expect(body).toContain("h2. ArchLucid Finding — Cost — Over-provisioned");
    expect(body).toContain("{{fid-1}}");
    expect(body).toContain("/architecture/reviews/run-42");
  });
});
