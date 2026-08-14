import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { TENANT_SETTINGS_PAGE_SUBTITLE } from "@/lib/tenant-settings-page-copy";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";

vi.mock("@/lib/demo-ui-env", () => ({
  isNextPublicDemoMode: () => false,
  isBuyerPolishedOperatorShellEnv: () => false,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
    <button type="button">{triggerText ?? "Help"}</button>
  ),
}));

vi.mock("./TenantCostSettingsCard", () => ({
  TenantCostSettingsCard: () => <div data-testid="tenant-cost-settings-card-stub" />,
}));

vi.mock("./TenantQualityGatesCard", () => ({
  TenantQualityGatesCard: () => <div data-testid="tenant-quality-gates-card-stub" />,
}));

vi.mock("./TenantWorkspaceProjectsCard", () => ({
  TenantWorkspaceProjectsCard: () => <div data-testid="tenant-workspace-projects-card-stub" />,
}));

vi.mock("@/components/WorkspaceScopeTenantSettingsVocabularyRail", () => ({
  WorkspaceScopeTenantSettingsVocabularyRail: ({
    currentLabel,
  }: {
    currentLabel?: string;
  }) => <div data-testid="workspace-scope-vocabulary-rail-stub" data-current-label={currentLabel} />,
}));

vi.mock("@/components/TenantLlmJudgeGuideCard", () => ({
  TenantLlmJudgeGuideCard: () => <div data-testid="tenant-llm-judge-guide-card-stub" />,
}));

vi.mock("@/components/SupportBundleDownloadButton", () => ({
  SupportBundleDownloadButton: () => <button type="button">Download support bundle</button>,
}));

vi.mock("@/lib/active-tenant-context-display", () => ({
  readActiveTenantContext: () => ({
    displayName: "Acme Architecture",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    workspaceLabel: "Pilot",
  }),
}));

import { TenantSettingsPageView } from "./TenantSettingsPageView";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

function buildModel(overrides: Partial<TenantSettingsPageContentModel> = {}): TenantSettingsPageContentModel {
  return {
    currentPrincipalName: "Test User",
    tenantDisplayName: "Acme Architecture",
    callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
    isTenantAdmin: true,
    trial: null,
    ...overrides,
  };
}

describe("TenantSettingsPageView", () => {
  it("renders tenant display name, effective scope summary, and caller authority metadata", async () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) =>
        key === "archlucid_operator_scope_v1"
          ? JSON.stringify({
              tenantId: "tenant-1",
              workspaceId: "workspace-1",
              projectId: "project-1",
              workspaceLabel: "Pilot",
              projectLabel: "Northwind",
            })
          : null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });

    render(<TenantSettingsPageView model={buildModel()} />);

    expect(screen.getByTestId("tenant-settings-tenant-display-name")).toHaveTextContent("Acme Architecture");
    expect(screen.getByText(TENANT_SETTINGS_PAGE_SUBTITLE)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("tenant-settings-active-scope-summary")).toHaveTextContent(
        "Active scope: Workspace: Pilot — Northwind",
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("tenant-settings-caller-authority")).toHaveTextContent(
        "Admin authority in Pilot",
      );
    });

    expect(screen.getByTestId("workspace-scope-vocabulary-rail-stub")).toHaveAttribute(
      "data-current-label",
      "Workspace settings",
    );
    expect(screen.getByRole("button", { name: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL })).toBeInTheDocument();
    expect(screen.queryByTestId("tenant-settings-claim-discipline")).not.toBeInTheDocument();
  });

  it("uses semantic heading order with section h2 and card h3 titles (P0-4, P0-8)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });

    render(<TenantSettingsPageView model={buildModel()} />);

    const headings = screen.getAllByRole("heading").map((node) => ({
      level: Number(node.tagName.slice(1)),
      name: node.textContent,
    }));

    expect(headings.some((heading) => heading.level === 2 && heading.name === "General")).toBe(true);
    expect(headings.some((heading) => heading.level === 2 && heading.name === "Business settings")).toBe(true);
    expect(
      headings.some((heading) => heading.level === 2 && heading.name === "Advanced — AI quality controls"),
    ).toBe(true);
    expect(screen.getByRole("heading", { level: 3, name: "Organization" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Active workspace and projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Sponsor digest (email)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Support bundle" })).toBeInTheDocument();
  });
});
