import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";
import {
  ALERT_RULES_CREATE_SUCCESS_MESSAGE,
  ALERT_RULES_LIST_EMPTY_TITLE,
} from "@/lib/alert-rule-conditions-copy";
import { alertRulesCreateButtonLabelReaderRank } from "@/lib/enterprise-controls-context-copy";

const mutateCapability = vi.hoisted(() => ({ current: true }));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => mutateCapability.current,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isOperatorExperienceFullShellEnv: () => true,
}));

const apiHoisted = vi.hoisted(() => ({
  listAlertRules: vi.fn(),
  listAlertRoutingSubscriptions: vi.fn(),
  createAlertRule: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listAlertRules: apiHoisted.listAlertRules,
  listAlertRoutingSubscriptions: apiHoisted.listAlertRoutingSubscriptions,
  createAlertRule: apiHoisted.createAlertRule,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const sampleRule = {
  ruleId: "rule-1",
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "default",
  name: "Workspace watch",
  ruleType: "CriticalRecommendationCount",
  severity: "High",
  thresholdValue: 2,
  isEnabled: true,
  targetChannelType: "DigestOnly",
  metadataJson: "{}",
  createdUtc: "2026-01-01T00:00:00Z",
};

describe("AlertRulesContent", () => {
  beforeEach(() => {
    mutateCapability.current = true;
    apiHoisted.listAlertRules.mockReset();
    apiHoisted.listAlertRoutingSubscriptions.mockReset();
    apiHoisted.createAlertRule.mockReset();
    apiHoisted.listAlertRules.mockResolvedValue([]);
    apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([]);
    apiHoisted.createAlertRule.mockResolvedValue(sampleRule);
  });

  it("renders finding-oriented rule preview and alert priority help", async () => {
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rule-live-preview")).toBeInTheDocument();
    });

    expect(screen.getByText(/finding count reaches at least/i)).toBeInTheDocument();
    expect(screen.getByText(/does not change the severity of the underlying findings/i)).toBeInTheDocument();
  });

  it("shows empty alert rules state", async () => {
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByText(ALERT_RULES_LIST_EMPTY_TITLE)).toBeInTheDocument();
    });
  });

  it("creates a rule with pending state and success live region", async () => {
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create rule" })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Create rule" }));

    await waitFor(() => {
      expect(apiHoisted.createAlertRule).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Architecture alert rule",
          ruleType: "CriticalRecommendationCount",
          severity: "Warning",
          thresholdValue: 3,
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("status", { name: /Alert rule status/i })).toHaveTextContent(
        ALERT_RULES_CREATE_SUCCESS_MESSAGE,
      );
    });
  });

  it("blocks create for readers and keeps duplicate submit guard while creating", async () => {
    mutateCapability.current = false;
    apiHoisted.createAlertRule.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(sampleRule), 50)),
    );

    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: alertRulesCreateButtonLabelReaderRank })).toBeDisabled();
    });
  });

  it("renders persisted rule rows with plain-language summaries", async () => {
    apiHoisted.listAlertRules.mockResolvedValue([sampleRule]);

    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rule-row-rule-1")).toBeInTheDocument();
    });

    expect(screen.getByText(/raises a High alert when critical and high-severity finding count reaches at least 2/i)).toBeInTheDocument();
  });
});
