import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

const proxyJsonGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: proxyJsonGetMock,
}));

vi.mock("./SettingsRolesInvitePanel", () => ({
  SettingsRolesInvitePanel: () => <div data-testid="settings-roles-invite-panel-mock" />,
}));

vi.mock("./PendingInvitationsPanel", () => ({
  PendingInvitationsPanel: () => <div data-testid="pending-invitations-panel-mock" />,
}));

vi.mock("./SettingsRolesPrincipalTable", () => ({
  SettingsRolesPrincipalTable: () => <div data-testid="settings-roles-principal-table-mock" />,
}));

vi.mock("@/components/ui/tabs", () => ({
  TabsContent: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
}));

import { SettingsRolesUsersTab } from "./SettingsRolesUsersTab";

function buildModel(overrides: Partial<SettingsRolesPageViewModel> = {}): SettingsRolesPageViewModel {
  return {
    surface: "admin",
    loading: false,
    sortedRows: [],
    usersNote: null,
    keysNote: null,
    usersDirectorySource: "manual",
    load: async () => {},
    onRoleChange: async () => "saved",
    ...overrides,
  };
}

const baseProps = {
  model: buildModel(),
  userRows: [],
  memberRoleFilter: null,
  memberStatusFilter: null,
  membersFilterSearch: "",
  membersFilterPathname: "/administration/users",
  usersTabInviteFirstLayout: true,
  usersTabEmptyWorkspace: true,
  usersSectionTitle: "Members",
  membersDirectorySourceTag: null,
  pendingSectionTitle: "Pending invitations",
  continueLastPrincipal: null,
  inviteEmailInputRef: { current: null },
  inviteSectionOpen: false,
  onInviteSectionOpenChange: vi.fn(),
  invitationsRefreshKey: 0,
  seededInvitations: [],
  onInviteSent: vi.fn(),
  onPendingInvitationCountChange: vi.fn(),
  onOpenPrincipal: vi.fn(),
};

describe("SettingsRolesUsersTab (TB-928)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows private-beta invite readiness callout when diagnostics report blockers", async () => {
    proxyJsonGetMock.mockResolvedValueOnce({
      operatorBaseUrlConfigured: false,
      localTrialIdentityConfigured: true,
    });

    render(<SettingsRolesUsersTab {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-beta-readiness-invite-callout")).toBeInTheDocument();
    });
  });

  it("hides the callout when diagnostics report no blockers", async () => {
    proxyJsonGetMock.mockResolvedValueOnce({
      operatorBaseUrlConfigured: true,
      localTrialIdentityConfigured: true,
    });

    render(<SettingsRolesUsersTab {...baseProps} />);

    await waitFor(() => {
      expect(proxyJsonGetMock).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("auth-beta-readiness-invite-callout")).toBeNull();
  });
});
