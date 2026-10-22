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

vi.mock("@/lib/admin-auth-domains-api", () => ({
  fetchTenantAuthDomains: vi.fn().mockResolvedValue([]),
  fetchTenantAuthDomainRecoveryAdmins: vi.fn().mockResolvedValue([]),
  fetchTenantAuthDomainEnforcementReadiness: vi.fn(),
  proposeTenantAuthDomain: vi.fn(),
  startTenantAuthDomainVerification: vi.fn(),
  checkTenantAuthDomainVerification: vi.fn(),
  testTenantAuthDomainRouting: vi.fn(),
  markTenantAuthDomainRoutingTested: vi.fn(),
  setTenantAuthDomainEnforcement: vi.fn(),
  enableTenantAuthDomainEnforcement: vi.fn(),
  addTenantAuthDomainRecoveryAdmin: vi.fn(),
  removeTenantAuthDomainRecoveryAdmin: vi.fn(),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/operator/OperatorNavAuthorityProvider")>();

  return {
    ...actual,
    useOperatorNavAuthority: () => ({
      ...actual.useOperatorNavAuthority(),
      callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
    }),
  };
});

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    workspaceLabel: "Claims Intake Demo",
    projectLabel: "Default project",
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AuthDomainsPageClient } from "@/app/(operator)/administration/auth-domains/AuthDomainsPageClient";
import {
  AUTH_DOMAINS_PAGE_TITLE,
  authDomainsJourneyStepAriaLabel,
} from "@/lib/auth-domains-page-copy";
import {
  AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE,
  AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE,
  AUTH_DOMAINS_SETTINGS_SOURCES,
} from "@/lib/auth-domains-settings-evidence-copy";
import {
  AUTH_DOMAINS_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  AUTH_DOMAINS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AUTH_DOMAINS_SETTINGS_PRIMARY_CONTENT_ID,
  AUTH_DOMAINS_SETTINGS_SKIP_LINK_LABEL,
  AUTH_DOMAINS_SETTINGS_SKIP_TARGET_ID,
  AUTH_DOMAINS_PAGE_SUBTITLE_BUYER,
  AUTH_DOMAINS_PAGE_SUBTITLE_OPERATOR,
  AUTH_DOMAINS_SETTINGS_BUYER_START_HERE_HELPER,
  AUTH_DOMAINS_SETTINGS_PAGE_LEAD,
  AUTH_DOMAINS_SETTINGS_START_HERE_CARD_TITLE,
} from "@/lib/auth-domains-settings-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("AuthDomainsPageClient buyer-polished shell (ADU)", () => {
  it("renders skip link, workflow before follow-ups, header claim discipline, and hides operator chrome", async () => {
    render(<AuthDomainsPageClient />);

    expect(screen.getByRole("link", { name: AUTH_DOMAINS_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_DOMAINS_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AUTH_DOMAINS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AUTH_DOMAINS_PAGE_SUBTITLE_OPERATOR)).not.toBeInTheDocument();
    expect(screen.getByTestId("auth-domains-settings-intro")).toHaveTextContent(AUTH_DOMAINS_SETTINGS_PAGE_LEAD);
    expect(screen.getByTestId("auth-domains-settings-buyer-start-here-helper")).toHaveTextContent(
      AUTH_DOMAINS_SETTINGS_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: AUTH_DOMAINS_SETTINGS_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("auth-domains-add")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-domains-new-domain")).not.toBeInTheDocument();
    expect(screen.getByTestId(AUTH_DOMAINS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("auth-domains-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-domains-authentication-help")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-domains-identity-providers-vocabulary-peer-link")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("auth-domains-settings-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(AUTH_DOMAINS_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = await screen.findByTestId(AUTH_DOMAINS_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const journeyStrip = screen.getByTestId("auth-domains-journey-strip");
    const orientationBottom = screen.getByTestId("auth-domains-orientation-bottom");
    const sourcesSection = screen.getByTestId("auth-domains-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(journeyStrip);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("auth-domains-page-title")).toHaveTextContent(AUTH_DOMAINS_PAGE_TITLE);
    expect(
      screen.getByRole("button", { name: authDomainsJourneyStepAriaLabel(0, "Add domain") }),
    ).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(AUTH_DOMAINS_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
