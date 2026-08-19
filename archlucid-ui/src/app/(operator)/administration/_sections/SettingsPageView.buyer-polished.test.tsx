import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navAuth = vi.hoisted(() => ({
  callerAuthorityRank: 1,
  isAuthorityLoading: false,
}));

const internalShell = vi.hoisted(() => ({
  enabled: false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: navAuth.callerAuthorityRank,
    isAuthorityLoading: navAuth.isAuthorityLoading,
    currentPrincipal: {
      provenance: "auth-me",
      name: "operator@test",
      roleClaimValues: [],
      primaryAppRole: null,
      maxAuthority: "ReadAuthority",
      authorityRank: navAuth.callerAuthorityRank,
      hasEnterpriseOperatorSurfaces: false,
      hasCommittedArchitectureReview: false,
      hasRecognizedArchLucidRole: true,
      permissionClaimValues: [],
    },
  }),
}));

vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: () => internalShell.enabled,
}));

vi.mock("@/lib/finish-setup-deployment", () => ({
  isSelfHostedDeploymentEnv: () => false,
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    workspaceLabel: "Contoso",
    projectLabel: "Pilot",
  }),
  getEffectiveBrowserProxyScopeHeaders: () => ({}),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/SupportBundleDownloadButton", () => ({
  SupportBundleDownloadButton: ({ showDiagnosticsLink }: { showDiagnosticsLink?: boolean }) => (
    <div data-testid="support-bundle-stub" data-diagnostics={showDiagnosticsLink ? "true" : "false"} />
  ),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration",
}));

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { SettingsPageView } from "./SettingsPageView";
import {
  SETTINGS_MASTER_PAGE_DESCRIPTION_BUYER,
  SETTINGS_MASTER_PAGE_DESCRIPTION_OPERATOR,
  SETTINGS_MASTER_PRIMARY_CONTENT_ID,
  SETTINGS_MASTER_SKIP_LINK_LABEL,
} from "./settings-master-page-copy";

describe("SettingsPageView buyer-polished shell (SET)", () => {
  beforeEach(() => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.ReadAuthority;
    navAuth.isAuthorityLoading = false;
    internalShell.enabled = false;
  });

  it("renders skip link, orientation above search, buyer description, and hides contextual help", () => {
    render(<SettingsPageView />);

    expect(screen.getByRole("link", { name: SETTINGS_MASTER_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SETTINGS_MASTER_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("settings-master-primary-content")).toBeInTheDocument();
    expect(screen.getByText(SETTINGS_MASTER_PAGE_DESCRIPTION_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SETTINGS_MASTER_PAGE_DESCRIPTION_OPERATOR)).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-master-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("settings-hub-sources")).toBeInTheDocument();

    const orientation = screen.getByTestId("settings-master-orientation-top");
    const searchField = screen.getByPlaceholderText("Search settings…");

    expect(
      orientation.compareDocumentPosition(searchField) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 1, name: OPERATOR_NAV_LINK_LABELS.settings }),
    ).toBeInTheDocument();
  });
});
