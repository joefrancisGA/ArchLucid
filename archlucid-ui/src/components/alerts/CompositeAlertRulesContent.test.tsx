import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";
import type { CompositeAlertRule } from "@/types/composite-alert-rules";

const mutateCapability = vi.hoisted(() => ({ current: true }));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => mutateCapability.current,
}));

const apiHoisted = vi.hoisted(() => ({
  listCompositeAlertRules: vi.fn(),
  createCompositeAlertRule: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listCompositeAlertRules: apiHoisted.listCompositeAlertRules,
  createCompositeAlertRule: apiHoisted.createCompositeAlertRule,
}));

const sampleRule: CompositeAlertRule = {
  compositeRuleId: "composite-1",
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "default",
  name: "Cost + compliance composite",
  severity: "High",
  operator: "And",
  isEnabled: true,
  suppressionWindowMinutes: 1440,
  cooldownMinutes: 60,
  reopenDeltaThreshold: 0,
  dedupeScope: "RuleAndRun",
  targetChannelType: "DigestOnly",
  createdUtc: "2026-01-01T00:00:00Z",
  conditions: [
    {
      conditionId: "condition-1",
      metricType: "CostIncreasePercent",
      operator: "GreaterThanOrEqual",
      thresholdValue: 10,
    },
    {
      conditionId: "condition-2",
      metricType: "NewComplianceGapCount",
      operator: "GreaterThanOrEqual",
      thresholdValue: 1,
    },
  ],
};

describe("CompositeAlertRulesContent", () => {
  beforeEach(() => {
    mutateCapability.current = true;
    apiHoisted.listCompositeAlertRules.mockReset();
    apiHoisted.createCompositeAlertRule.mockReset();
    apiHoisted.listCompositeAlertRules.mockResolvedValue([sampleRule]);
  });

  it("renders persisted composite rules with operator-safe labels and no engineering enum strings in the list", async () => {
    render(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("composite-alert-rule-row-composite-1")).toBeInTheDocument();
    });

    const listRow = screen.getByTestId("composite-alert-rule-row-composite-1");

    expect(listRow).toHaveTextContent(sampleRule.name);
    expect(listRow).toHaveTextContent("All conditions (AND)");
    expect(listRow).toHaveTextContent("Alert priority: High");
    expect(listRow).toHaveTextContent("Dedupe: Rule + review");
    expect(listRow).toHaveTextContent("Cost increase % ≥ 10");
    expect(listRow).toHaveTextContent("New compliance gap count (security deltas) ≥ 1");
    expect(within(listRow).getByText("Active")).toBeInTheDocument();

    expect(listRow.textContent).not.toMatch(/GreaterThanOrEqual/i);
    expect(listRow.textContent).not.toMatch(/Enabled:\s*true/i);
    expect(listRow.textContent).not.toMatch(/RuleAndRun/i);
  });

  it("renders operator selects without engineering enum suffixes", async () => {
    render(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("composite-alert-rule-row-composite-1")).toBeInTheDocument();
    });

    const operatorSelects = screen.getAllByLabelText("Operator");

    for (const operatorSelect of operatorSelects) {
      expect(within(operatorSelect).getAllByRole("option", { name: "≥" }).length).toBeGreaterThanOrEqual(1);
      expect(within(operatorSelect).queryByRole("option", { name: /GreaterThanOrEqual/i })).not.toBeInTheDocument();
    }
  });

  it("TB-1583: hides reserved reopen-delta copy from the create form", async () => {
    render(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("composite-alert-rule-row-composite-1")).toBeInTheDocument();
    });

    expect(screen.queryByText(/reserved for future use/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/reopen delta threshold/i)).not.toBeInTheDocument();
  });

  it("TB-1580: uses design-system Input fields and a primary Create Button on the composite form", async () => {
    render(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("composite-alert-rule-row-composite-1")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByTestId("composite-rules-create-button")).toHaveTextContent("Create composite rule");
  });

  it("TB-1580: composite form source avoids raw html input and button elements", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "CompositeAlertRulesContent.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/<input\b/);
    expect(source).not.toMatch(/<button\b/);
    expect(source).toContain('data-testid="composite-rules-create-button"');
    expect(source).toContain('variant="primary"');
  });

  it("TB-1579: does not render a duplicate hub page-title h2 on the composite panel", async () => {
    render(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("composite-alert-rule-row-composite-1")).toBeInTheDocument();
    });

    expect(screen.queryByRole("heading", { level: 2, name: "Advanced alert rules" })).not.toBeInTheDocument();
  });

  it("TB-1579: composite panel source avoids page-title h2 chrome", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "CompositeAlertRulesContent.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/<h2\b/);
    expect(source).not.toContain("OPERATOR_TYPOGRAPHY.pageTitle");
  });

  it("TB-1583: shows a list loading skeleton while composite rules are loading", async () => {
    let resolveList: ((rules: CompositeAlertRule[]) => void) | undefined;
    apiHoisted.listCompositeAlertRules.mockImplementation(
      () =>
        new Promise<CompositeAlertRule[]>((resolve) => {
          resolveList = resolve;
        }),
    );

    render(<CompositeAlertRulesContent />);

    expect(screen.getByTestId("composite-alert-rules-list-loading-skeleton")).toBeInTheDocument();
    expect(screen.queryByText(/reserved for future use/i)).not.toBeInTheDocument();
    expect(screen.queryByText("None yet.")).not.toBeInTheDocument();

    resolveList?.([sampleRule]);

    await waitFor(() => {
      expect(screen.getByTestId("composite-alert-rule-row-composite-1")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("composite-alert-rules-list-loading-skeleton")).not.toBeInTheDocument();
  });
});
