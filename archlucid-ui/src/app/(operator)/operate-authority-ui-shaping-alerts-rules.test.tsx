import "./operate-authority-ui-shaping.setup.tsx";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  alertSimulationCurrentBehaviorHeadingReader,
  alertTuningCurrentTuningHeadingReader,
  compositeRulesCreateButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { scopeGovernanceWorkflowVitestReview } from "@/testing/governance-workflow-vitest-navigation";

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";
import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";
import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

import {
  apiHoisted,
  governanceWorkflowVitestNavigation,
  mutateCapability,
  sampleListedRule,
} from "./operate-authority-ui-shaping.fixtures";

describe("Enterprise authority UI shaping — alert rules", () => {
  beforeEach(() => {
    scopeGovernanceWorkflowVitestReview(governanceWorkflowVitestNavigation, "gov-ui-shape-run");
  });

  it("Alert tuning: Current tuning heading uses inspect framing when mutation capability is false", () => {
    mutateCapability.current = false;
    render(<AlertTuningContent />);

    expect(screen.getByRole("heading", { name: alertTuningCurrentTuningHeadingReader })).toBeInTheDocument();
  });

  it("Alert simulation: Simulated outcome heading uses inspect framing when mutation capability is false", () => {
    mutateCapability.current = false;
    render(<AlertSimulationContent />);

    expect(
      screen.getAllByRole("heading", { name: alertSimulationCurrentBehaviorHeadingReader }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("Alert rules: Create rule stays disabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    apiHoisted.listAlertRules.mockResolvedValue([sampleListedRule]);
    renderWithOperatorQuery(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create rule \(Execute\+\)/ })).toBeDisabled();
    });
  });

  it("Alert rules: Create rule enables after load when mutation capability is true", async () => {
    mutateCapability.current = true;
    apiHoisted.listAlertRules.mockResolvedValue([sampleListedRule]);
    renderWithOperatorQuery(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create rule" })).not.toBeDisabled();
    });
  });

  it("Alert rules: Simulate runs POST simulation and headlines when alerts would fire", async () => {
    mutateCapability.current = true;
    apiHoisted.listAlertRules.mockResolvedValue([sampleListedRule]);

    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Test rule Simulate-able rule/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Test rule Simulate-able rule/ }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Simulate: Simulate-able rule/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("alert-rule-simulate-run"));

    await waitFor(() => {
      expect(apiHoisted.simulateAlertRule).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("alert-rule-simulate-verdict")).toHaveTextContent("Alert would fire");

      const arg = apiHoisted.simulateAlertRule.mock.calls[0]![0] as Record<string, unknown>;

      expect(arg.ruleKind).toBe("Simple");

      expect(arg.simpleRule).toMatchObject({ ruleId: "r-ui-simulate", thresholdValue: 2 });
    });
  });

  it("Composite alert rules: Create composite rule stays disabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    render(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: compositeRulesCreateButtonLabelReaderRank })).toBeDisabled();
    });
  });

  it("Composite alert rules: Create composite rule enables after load when mutation capability is true", async () => {
    mutateCapability.current = true;
    render(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create composite rule" })).not.toBeDisabled();
    });
  });
});
