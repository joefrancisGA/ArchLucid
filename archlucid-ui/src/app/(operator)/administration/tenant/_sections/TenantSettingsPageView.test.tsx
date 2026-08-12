import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  WorkspaceScopeTenantSettingsVocabularyRail: () => <div data-testid="workspace-scope-vocabulary-rail-stub" />,
}));

vi.mock("@/components/TenantLlmJudgeGuideCard", () => ({
  TenantLlmJudgeGuideCard: () => <div data-testid="tenant-llm-judge-guide-card-stub" />,
}));

vi.mock("@/components/SupportBundleDownloadButton", () => ({
  SupportBundleDownloadButton: () => <button type="button">Download support bundle</button>,
}));

import { TenantSettingsPageView } from "./TenantSettingsPageView";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

function buildModel(overrides: Partial<TenantSettingsPageContentModel> = {}): TenantSettingsPageContentModel {
  return {
    currentPrincipalName: "Test User",
    tenantDisplayName: "Acme Architecture",
    isTenantAdmin: true,
    trial: null,
    ...overrides,
  };
}

describe("TenantSettingsPageView", () => {
  it("renders tenant display name, active scope summary, and short Help trigger (P0-1, P0-2, P0-6)", () => {
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
    expect(screen.getByTestId("tenant-settings-active-scope-summary")).toHaveTextContent(
      "Active scope: Workspace: Pilot — Northwind",
    );
    expect(screen.getByTestId("tenant-settings-signed-in-as")).toHaveTextContent("Signed in as Test User");
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { level: 3, name: "Executive digest (email)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Support bundle" })).toBeInTheDocument();
  });
});
