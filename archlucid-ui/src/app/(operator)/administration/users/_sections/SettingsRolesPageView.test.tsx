import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEffect } from "react";

const replaceMock = vi.fn();
const pendingInvitationCountMock = vi.hoisted(() => ({ value: 0 }));

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/administration/users",
  useRouter: (): { push: () => void; replace: typeof replaceMock; refresh: () => void } => ({
    push: vi.fn(),
    replace: replaceMock,
    refresh: vi.fn(),
  }),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

vi.mock("@/lib/api-keys-settings-access", () => ({
  isApiKeysSettingsSurfaceEnabled: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 3,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Admin User",
      roleClaimValues: ["Admin"],
      primaryAppRole: "Admin" as const,
      maxAuthority: "AdminAuthority" as const,
      authorityRank: 3,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      hasRecognizedArchLucidRole: true,
      permissionClaimValues: [],
    },
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./SettingsRolesInvitePanel", () => ({
  SettingsRolesInvitePanel: () => <div data-testid="settings-roles-invite-form" />,
}));

vi.mock("./PendingInvitationsPanel", () => ({
  PendingInvitationsPanel: ({
    onCountChange,
    suppressEmptyPresentation,
  }: {
    onCountChange?: (count: number | null) => void;
    suppressEmptyPresentation?: boolean;
  }) => {
    useEffect(() => {
      onCountChange?.(pendingInvitationCountMock.value);
    }, [onCountChange]);

    if (suppressEmptyPresentation) {
      return (
        <p data-testid="settings-roles-pending-invitations-audit-footnote">
          <a href="/governance/audit">audit trail</a>
        </p>
      );
    }

    return <div data-testid="settings-roles-pending-invitations-table" />;
  },
}));

vi.mock("./SettingsRolesMatrixSection", () => ({
  SettingsRolesMatrixSection: () => <div data-testid="settings-roles-matrix-section" />,
}));

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { resolveNavLinkForPathname } from "@/lib/resolve-nav-link-for-pathname";
import { ROUTE_TITLES } from "@/lib/route-static-titles";

import { SettingsRolesPageView } from "./SettingsRolesPageView";
import {
  SETTINGS_ROLES_KEYS_TAB_CARD_TITLE,
  SETTINGS_ROLES_KEYS_TAB_LABEL,
  SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF,
  SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL,
} from "./settings-roles-page-keys-tab-copy";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

function buildModel(overrides: Partial<SettingsRolesPageViewModel> = {}): SettingsRolesPageViewModel {
  return {
    surface: "admin",
    loading: false,
    sortedRows: [],
    usersNote: "api_unavailable",
    keysNote: null,
    usersDirectorySource: "manual",
    load: vi.fn(async () => undefined),
    onRoleChange: vi.fn(async () => "saved"),
    ...overrides,
  };
}

describe("SettingsRolesPageView (SSU P0)", () => {
  it("renders the Members card when the directory API is unavailable", () => {
    render(<SettingsRolesPageView model={buildModel()} />);

    expect(screen.getByText("Member directory unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Members" })).toBeInTheDocument();
  });

  it("exposes a persistent Invite user primary action and section headings", () => {
    render(<SettingsRolesPageView model={buildModel({ usersNote: "load_failed" })} />);

    expect(screen.getByTestId("settings-roles-invite-primary-action")).toHaveTextContent("Invite user");
    expect(screen.getByRole("heading", { level: 1, name: OPERATOR_NAV_LINK_LABELS.usersAndRoles })).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Invite user" })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("settings-roles-invite-primary-action"));

    expect(screen.getByTestId("settings-roles-invite-section")).toHaveAttribute("open");
  });

  it("aligns page title with nav and document title (TB-1212)", () => {
    expect(ROUTE_TITLES["/administration/users"]).toBe(OPERATOR_NAV_LINK_LABELS.usersAndRoles);
    expect(resolveNavLinkForPathname("/administration/users")?.label).toBe(OPERATOR_NAV_LINK_LABELS.usersAndRoles);

    render(<SettingsRolesPageView model={buildModel({ usersNote: null })} />);

    expect(screen.getByRole("heading", { level: 1, name: OPERATOR_NAV_LINK_LABELS.usersAndRoles })).toBeInTheDocument();
  });

  it("registers contextual help for users hub paths (TB-1215)", () => {
    expect(pageHelpTopicForPathname("/administration/users")?.slug).toBe("users-and-roles");
    expect(pageHelpTopicForPathname("/administration/users")?.label).toBe(
      `${OPERATOR_NAV_LINK_LABELS.usersAndRoles} help`,
    );
    expect(pageHelpTopicForPathname("/administration/settings/users")?.label).toBe(
      `${OPERATOR_NAV_LINK_LABELS.usersAndRoles} help`,
    );
  });

  it("uses invite-first empty composition without stacked empty cards (TB-1214, TB-1937, TB-1939)", () => {
    render(<SettingsRolesPageView model={buildModel({ usersNote: null })} />);

    const inviteRegion = screen.getByTestId("settings-roles-invite-primary-region");
    const emptyComposition = screen.getByTestId("settings-roles-users-empty-composition");

    expect(inviteRegion).toBeInTheDocument();
    expect(emptyComposition).toBeInTheDocument();
    expect(inviteRegion.compareDocumentPosition(emptyComposition) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("settings-roles-users-empty-status")).toHaveTextContent(/No users yet/i);
    expect(screen.getByTestId("settings-roles-invite-form")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-roles-invite-section")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: /Members/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: /Pending invitations/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/No pending invitations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/principal/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-members-directory-source")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-pending-invitations-audit-footnote")).toBeInTheDocument();
  });

  it("uses invite-first empty composition when the directory returns empty_response", () => {
    render(<SettingsRolesPageView model={buildModel({ usersNote: "empty_response" })} />);

    expect(screen.getByTestId("settings-roles-invite-primary-region")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-users-empty-composition")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-users-empty-status")).toHaveTextContent(/No users yet/i);
    expect(screen.queryByRole("heading", { level: 2, name: /Members/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: /Pending invitations/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-members-directory-source")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-pending-invitations-audit-footnote")).toBeInTheDocument();
  });

  it("shows Members (0) without Refresh when the directory returns empty_response with pending invitations", () => {
    pendingInvitationCountMock.value = 2;

    render(<SettingsRolesPageView model={buildModel({ usersNote: "empty_response" })} />);

    expect(screen.getByRole("heading", { level: 2, name: "Members (0)" })).toBeInTheDocument();
    expect(screen.getByText("No members yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-members-directory-source")).toBeInTheDocument();

    pendingInvitationCountMock.value = 0;
  });

  it("shows unavailable members copy with Refresh when the directory API is unavailable", () => {
    render(<SettingsRolesPageView model={buildModel({ usersNote: "api_unavailable" })} />);

    expect(screen.getByText("Member directory unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Members" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Members (0)" })).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-members-directory-source")).toBeInTheDocument();
  });

  it("persists ?tab=users when the Users tab is selected (TB-1936)", () => {
    replaceMock.mockClear();
    render(<SettingsRolesPageView model={buildModel({ usersNote: null })} />);

    fireEvent.click(screen.getByTestId("settings-roles-tab-users"));

    expect(replaceMock).toHaveBeenCalledWith(SETTINGS_USERS_USERS_TAB_PATH);
  });

  it("shows users-specific error copy without principals jargon (TB-1938)", () => {
    render(<SettingsRolesPageView model={buildModel({ usersNote: "load_failed" })} />);

    const usersPanel = screen.getByTestId("settings-roles-tabpanel-users");

    expect(within(usersPanel).getByTestId("settings-roles-api-note")).toBeInTheDocument();
    expect(within(usersPanel).getByText(/workspace member list/i)).toBeInTheDocument();
    expect(within(usersPanel).queryByText(/principal/i)).not.toBeInTheDocument();
  });
});

describe("SettingsRolesPageView (SEU / keys tab)", () => {
  it("uses API key role assignment chrome instead of credential lifecycle wording (TB-1931)", () => {
    render(<SettingsRolesPageView model={buildModel({ usersNote: null, keysNote: null })} />);

    fireEvent.click(screen.getByTestId("settings-roles-tab-keys"));

    const keysPanel = screen.getByTestId("settings-roles-tabpanel-keys");

    expect(screen.getByRole("tab", { name: SETTINGS_ROLES_KEYS_TAB_LABEL })).toBeInTheDocument();
    expect(within(keysPanel).getByText(SETTINGS_ROLES_KEYS_TAB_CARD_TITLE)).toBeInTheDocument();
    expect(within(keysPanel).getByText(/Assign built-in roles to automation API keys/i)).toBeInTheDocument();
    expect(within(keysPanel).queryByText(/automation principals/i)).not.toBeInTheDocument();
    expect(within(keysPanel).getByRole("link", { name: "CLI usage help" })).toHaveAttribute(
      "href",
      SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF,
    );
  });

  it("shows keys-specific empty copy when the keys directory fails (TB-1933)", () => {
    render(
      <SettingsRolesPageView
        model={buildModel({
          usersNote: "api_unavailable",
          keysNote: "api_unavailable",
        })}
      />,
    );

    fireEvent.click(screen.getByTestId("settings-roles-tab-keys"));

    const keysPanel = screen.getByTestId("settings-roles-tabpanel-keys");

    expect(within(keysPanel).getByTestId("settings-roles-api-keys-note")).toBeInTheDocument();
    expect(within(keysPanel).getByText("API key directory unavailable")).toBeInTheDocument();
    expect(within(keysPanel).queryByText(/Member directory unavailable/i)).not.toBeInTheDocument();
    expect(within(keysPanel).queryByText(/invitation/i)).not.toBeInTheDocument();
    expect(within(keysPanel).queryByText(/principal/i)).not.toBeInTheDocument();
  });

  it("exposes primary Open CLI usage help CTA on keys empty path (TB-1213, TB-1932)", () => {
    render(<SettingsRolesPageView model={buildModel({ usersNote: null, keysNote: null })} />);

    fireEvent.click(screen.getByTestId("settings-roles-tab-keys"));

    const keysPanel = screen.getByTestId("settings-roles-tabpanel-keys");
    const openCta = within(keysPanel).getByTestId("settings-roles-keys-open-api-keys");

    expect(within(keysPanel).getByTestId("settings-roles-keys-empty")).toBeInTheDocument();
    expect(openCta).toHaveTextContent(SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL);
    expect(openCta).toHaveAttribute("href", SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF);
    expect(openCta.className).toContain("al-primary-action-bg");
    expect(within(keysPanel).queryByText(/No principals found/i)).not.toBeInTheDocument();
  });

  it("pins continue last viewed principal when the directory has users", () => {
    window.localStorage.removeItem("archlucid_settings_principal_continue_last_v1");

    render(
      <SettingsRolesPageView
        model={buildModel({
          usersNote: null,
          sortedRows: [
            {
              id: "u1",
              kind: "user",
              name: "Ada",
              detail: "ada@example.com",
              role: "Operator",
            },
          ],
        })}
      />,
    );

    expect(screen.getByTestId("settings-roles-continue-last-viewed-row")).toHaveTextContent("Ada");
    expect(screen.getByTestId("settings-roles-continue-last-viewed-open")).toBeInTheDocument();
    expect(document.querySelector('[data-principal-id="u1"]')).toBeInTheDocument();
  });
});
