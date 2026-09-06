import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  WORKSPACE_SETTINGS_HELP_TOPIC_LABEL: "How workspace settings work",
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

vi.mock("./TenantCostSettingsCard", () => ({
  TenantCostSettingsCard: ({ canEdit }: { canEdit: boolean }) => (
    <div data-testid="tenant-cost-settings-card-stub" data-can-edit={canEdit ? "true" : "false"} />
  ),
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

import {
  TENANT_SETTINGS_CLAIM_DISCIPLINE,
  TENANT_SETTINGS_FOLLOW_UPS_TITLE,
  TENANT_SETTINGS_SOURCES,
} from "@/lib/tenant-settings-evidence-copy";
import { TENANT_SETTINGS_PAGE_SUBTITLE } from "@/lib/tenant-settings-page-copy";
import {
  TENANT_SETTINGS_PAGE_SUBTITLE_BUYER,
  TENANT_SETTINGS_SETTINGS_BUYER_START_HERE_HELPER,
  TENANT_SETTINGS_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  TENANT_SETTINGS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  TENANT_SETTINGS_SETTINGS_PAGE_LEAD,
  TENANT_SETTINGS_SETTINGS_PRIMARY_CONTENT_ID,
  TENANT_SETTINGS_SETTINGS_SKIP_LINK_LABEL,
  TENANT_SETTINGS_SETTINGS_SKIP_TARGET_ID,
  TENANT_SETTINGS_SETTINGS_START_HERE_CARD_TITLE,
} from "@/lib/tenant-settings-settings-page-copy";
import { TenantSettingsPageView } from "./TenantSettingsPageView";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

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

describe("TenantSettingsPageView buyer-polished shell (ATE)", () => {
  it("renders skip link, intro, read-only cost card, sources chrome, and hides mutations", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });

    render(<TenantSettingsPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: TENANT_SETTINGS_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${TENANT_SETTINGS_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(TENANT_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(TENANT_SETTINGS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("tenant-settings-intro")).toHaveTextContent(TENANT_SETTINGS_SETTINGS_PAGE_LEAD);
    expect(screen.getByTestId("tenant-settings-buyer-start-here-helper")).toHaveTextContent(
      TENANT_SETTINGS_SETTINGS_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: TENANT_SETTINGS_SETTINGS_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId(TENANT_SETTINGS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      TENANT_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByRole("button", { name: "Page help" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("workspace-scope-vocabulary-rail-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tenant-workspace-projects-card-stub")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download support bundle" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("tenant-advanced-section")).not.toBeInTheDocument();
    expect(screen.getByTestId("tenant-cost-settings-card-stub")).toHaveAttribute("data-can-edit", "false");
    expect(screen.getByRole("heading", { level: 2, name: TENANT_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(TENANT_SETTINGS_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(TENANT_SETTINGS_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("tenant-settings-orientation-bottom");
    const sourcesSection = screen.getByTestId("tenant-settings-settings-sources");
    const organizationCard = screen.getByTestId("tenant-settings-organization-card");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(organizationCard);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(TENANT_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
