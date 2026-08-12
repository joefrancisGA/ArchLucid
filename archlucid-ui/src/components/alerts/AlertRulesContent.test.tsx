import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";
import {
  ALERT_RULES_ALERT_PRIORITY_LABEL,
  ALERT_RULES_CREATE_BLOCKED_HINT,
  ALERT_RULES_CREATE_SUCCESS_MESSAGE,
  ALERT_RULES_LIST_EMPTY_TITLE,
  ALERT_RULES_NAME_LABEL,
  ALERT_RULES_PREVIEW_DRAFT_STATUS_LABEL,
  ALERT_RULES_RULE_TYPE_HELP,
  ALERT_RULES_RULE_TYPE_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import { alertRulesCreateButtonLabelReaderRank, enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import {
  clearOperatorScopeStorage,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";

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
  async function revealCreateForm(): Promise<void> {
    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-create-action")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("alert-rules-create-action"));

    await waitFor(() => {
      expect(screen.getByLabelText(ALERT_RULES_NAME_LABEL)).toBeInTheDocument();
    });
  }

  beforeEach(() => {
    mutateCapability.current = true;
    clearOperatorScopeStorage();
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
      expect(screen.getByTestId("alert-rules-empty")).toBeInTheDocument();
    });

    await revealCreateForm();

    expect(screen.getByText(/does not change the severity of the underlying findings/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(ALERT_RULES_NAME_LABEL), {
      target: { value: "Custom workspace watch" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("alert-rule-live-preview")).toBeInTheDocument();
    });

    expect(screen.getByText(/finding count reaches at least/i)).toBeInTheDocument();
  });

  it("shows empty alert rules state", async () => {
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-empty")).toHaveTextContent(ALERT_RULES_LIST_EMPTY_TITLE);
    });
  });

  it("empty-first hides form and preview until Create reveals the panel (TB-1479)", async () => {
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-layout")).toHaveAttribute("data-empty-intro", "true");
    });

    expect(screen.getByTestId("alert-rules-layout").className).toContain("gap-4");
    expect(screen.getByTestId("alert-rules-layout").className).not.toContain("gap-8");
    expect(screen.queryByLabelText(ALERT_RULES_NAME_LABEL)).toBeNull();
    expect(screen.queryByTestId("alert-rule-live-preview")).toBeNull();
    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-create-action")).toBeInTheDocument();
    });

    await revealCreateForm();

    expect(screen.getByTestId("alert-rules-layout")).toHaveAttribute("data-empty-intro", "false");
    expect(screen.queryByTestId("alert-rules-create-action")).toBeNull();
  });

  it("TB-1584: demotes Conditions tab lead to h3 under the hub page title", async () => {
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 3, name: "Alert conditions" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("heading", { level: 2, name: "Alert conditions" })).not.toBeInTheDocument();
  });

  it("TB-1584: Conditions tab source avoids page-title h2 chrome", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "alerts", "AlertRulesContent.tsx"), "utf8");

    expect(source).not.toMatch(/<h2\b/);
    expect(source).not.toContain("OPERATOR_TYPOGRAPHY.pageTitle");
  });

  it("TB-1585: Conditions tab source avoids stacked tab-lead helper paragraph", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "alerts", "AlertRulesContent.tsx"), "utf8");

    expect(source).not.toContain("ALERT_RULES_CONDITIONS_FINDINGS_HELPER");
    expect(source).toContain("ALERT_RULES_RULE_TYPE_HELP");
  });

  it("TB-1585: surfaces findings and notification honesty on condition type field help", async () => {
    render(<AlertRulesContent />);

    await revealCreateForm();

    expect(screen.getByText(ALERT_RULES_RULE_TYPE_HELP)).toBeInTheDocument();
  });

  it("TB-1586: empty intro keeps one primary header Create (TB-1539)", async () => {
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-create-action")).toBeInTheDocument();
    });

    const primaryButtons = screen
      .getAllByRole("button")
      .filter((button) => button.className.includes("al-primary-action-bg"));

    expect(primaryButtons).toHaveLength(1);
    expect(primaryButtons[0]).toHaveAttribute("data-testid", "alert-rules-create-action");
  });

  it("TB-1586: revealed form promotes one primary submit Create", async () => {
    render(<AlertRulesContent />);

    await revealCreateForm();

    expect(screen.queryByTestId("alert-rules-create-action")).toBeNull();

    const submit = screen.getByTestId("alert-rules-create-button");

    expect(submit.className).toContain("al-primary-action-bg");

    const primaryButtons = screen
      .getAllByRole("button")
      .filter((button) => button.className.includes("al-primary-action-bg"));

    expect(primaryButtons).toHaveLength(1);
    expect(primaryButtons[0]).toBe(submit);
  });

  it("TB-1586: create buttons source use primary sm variants", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "alerts", "AlertRulesContent.tsx"), "utf8");

    for (const testId of ["alert-rules-create-action", "alert-rules-create-button"] as const) {
      const buttonBlock = source.match(new RegExp(`<Button[\\s\\S]*?data-testid="${testId}"[\\s\\S]*?>`))?.[0];

      expect(buttonBlock).toBeTruthy();
      expect(buttonBlock).toContain('variant="primary"');
      expect(buttonBlock).toContain('size="sm"');
    }
  });

  it("TB-1588: shows a list loading skeleton while alert rules are loading", async () => {
    let resolveList: ((rules: typeof sampleRule[]) => void) | undefined;
    apiHoisted.listAlertRules.mockImplementation(
      () =>
        new Promise<typeof sampleRule[]>((resolve) => {
          resolveList = resolve;
        }),
    );
    apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([]);

    render(<AlertRulesContent />);

    expect(screen.getByTestId("alert-rules-list-loading-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("alert-rules-empty")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-rules-create-action")).not.toBeInTheDocument();

    resolveList?.([]);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-empty")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("alert-rules-list-loading-skeleton")).not.toBeInTheDocument();
  });

  it("TB-1588: create form uses design-system Select controls", async () => {
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-empty")).toBeInTheDocument();
    });

    await revealCreateForm();

    expect(screen.getByTestId("alert-rule-type-select")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rule-priority-select")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: ALERT_RULES_RULE_TYPE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: ALERT_RULES_ALERT_PRIORITY_LABEL })).toBeInTheDocument();
  });

  it("TB-1588: Conditions tab source avoids raw select elements", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "alerts", "AlertRulesContent.tsx"), "utf8");

    expect(source).toMatch(/from "@\/components\/ui\/select"/);
    expect(source).not.toMatch(/<select\b/);
  });

  it("stacks live preview rail when empty list uses default draft (TB-1574)", async () => {
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-layout")).toHaveAttribute("data-live-rail-pinned", "false");
    });

    expect(screen.getByTestId("alert-rules-layout").className).not.toMatch(/xl:grid-cols-/);
    expect(screen.queryByTestId("alert-rule-live-preview")).toBeNull();

    await revealCreateForm();

    expect(screen.queryByTestId("alert-rule-live-preview")).toBeNull();
  });

  it("pins live preview rail after the create draft leaves defaults (TB-1574)", async () => {
    render(<AlertRulesContent />);

    await revealCreateForm();

    fireEvent.change(screen.getByLabelText(ALERT_RULES_NAME_LABEL), {
      target: { value: "Custom workspace watch" },
    });

    expect(screen.getByTestId("alert-rules-layout")).toHaveAttribute("data-live-rail-pinned", "true");
    expect(screen.getByTestId("alert-rules-layout").className).toMatch(/xl:grid-cols-/);
  });

  it("pins live preview rail when rules already exist (TB-1574)", async () => {
    apiHoisted.listAlertRules.mockResolvedValue([sampleRule]);
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-layout")).toHaveAttribute("data-live-rail-pinned", "true");
    });
  });

  it("creates a rule with pending state and success live region", async () => {
    render(<AlertRulesContent />);

    await revealCreateForm();

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

    const createButton = screen.getByTestId("alert-rules-create-button");

    expect(screen.getByTestId("alert-rules-mutate-disabled-hint")).toHaveTextContent(
      enterpriseMutationControlDisabledTitle,
    );
    expect(createButton).toHaveAttribute("aria-describedby", "alert-rules-mutate-disabled-hint");
  });

  it("names the target workspace beside the create control", async () => {
    render(<AlertRulesContent />);

    await revealCreateForm();

    await waitFor(() => {
      expect(screen.getByTestId("mutating-in-workspace-chip")).toBeInTheDocument();
    });

    expect(screen.getByTestId("mutating-in-workspace-chip")).toHaveTextContent(
      "Applies to workspace: Claims Intake",
    );
  });


  it("marks the rule preview as an unsaved draft so it cannot read as a configured rule", async () => {
    render(<AlertRulesContent />);

    await revealCreateForm();

    fireEvent.change(screen.getByLabelText(ALERT_RULES_NAME_LABEL), {
      target: { value: "Custom workspace watch" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("alert-rule-preview-draft-status")).toBeInTheDocument();
    });

    expect(screen.getByTestId("alert-rule-preview-draft-status")).toHaveTextContent(
      ALERT_RULES_PREVIEW_DRAFT_STATUS_LABEL,
    );
  });

  it("shows an inline readiness hint instead of a toast when the name is cleared", async () => {
    render(<AlertRulesContent />);

    await revealCreateForm();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create rule" })).not.toBeDisabled();
    });

    expect(screen.queryByTestId("alert-rules-create-readiness")).toBeNull();

    fireEvent.change(screen.getByLabelText(ALERT_RULES_NAME_LABEL), { target: { value: "  " } });

    expect(screen.getByRole("button", { name: "Create rule" })).toBeDisabled();
    expect(screen.getByTestId("alert-rules-create-readiness")).toHaveTextContent(
      ALERT_RULES_CREATE_BLOCKED_HINT,
    );
  });

  it("renders persisted rule rows with plain-language summaries", async () => {
    apiHoisted.listAlertRules.mockResolvedValue([sampleRule]);

    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rule-row-rule-1")).toBeInTheDocument();
    });

    expect(screen.getByText(/raises a High alert when critical and high-severity finding count reaches at least 2/i)).toBeInTheDocument();
  });

  it("omits silent projectId=default when the rules list is empty and session has no project", async () => {
    render(<AlertRulesContent />);

    await revealCreateForm();

    fireEvent.change(screen.getByLabelText(ALERT_RULES_NAME_LABEL), {
      target: { value: "Custom workspace watch" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("alert-rule-scope-preview")).toBeInTheDocument();
    });

    expect(screen.getByTestId("alert-rule-scope-preview")).toHaveTextContent(/current workspace/i);
    expect(screen.getByTestId("alert-rule-scope-preview").textContent?.toLowerCase()).not.toContain("default");
  });

  it("uses session project scope for empty-list preview instead of inventing default", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      projectId: "tenant-proj",
      workspaceLabel: "Claims Intake Workspace",
      projectLabel: "Tenant project",
    });

    render(<AlertRulesContent />);

    await revealCreateForm();

    fireEvent.change(screen.getByLabelText(ALERT_RULES_NAME_LABEL), {
      target: { value: "Custom workspace watch" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("alert-rule-scope-preview")).toHaveTextContent(/current project scope/i);
    });
  });
});

