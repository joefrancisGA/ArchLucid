import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();

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

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 3,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./SettingsRolesInvitePanel", () => ({
  SettingsRolesInvitePanel: () => <div data-testid="settings-roles-invite-form" />,
}));

vi.mock("./PendingInvitationsPanel", () => ({
  PendingInvitationsPanel: () => <div data-testid="settings-roles-pending-invitations-table" />,
}));

vi.mock("./SettingsRolesMatrixSection", () => ({
  SettingsRolesMatrixSection: () => <div data-testid="settings-roles-matrix-section" />,
}));

import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";

import { SettingsRolesPageView } from "./SettingsRolesPageView";
import {
  SETTINGS_ROLES_KEYS_TAB_CARD_TITLE,
  SETTINGS_ROLES_KEYS_TAB_LABEL,
} from "./settings-roles-page-keys-tab-copy";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

function buildModel(overrides: Partial<SettingsRolesPageViewModel> = {}): SettingsRolesPageViewModel {
  return {
    surface: "admin",
    loading: false,
    sortedRows: [],
    usersNote: "api_unavailable",
    keysNote: null,
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
    render(<SettingsRolesPageView model={buildModel({ usersNote: null })} />);

    expect(screen.getByTestId("settings-roles-invite-primary-action")).toHaveTextContent("Invite user");
    expect(screen.getByRole("heading", { level: 2, name: /Members/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Pending invitations" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Invite user" })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("settings-roles-invite-primary-action"));

    expect(screen.getByTestId("settings-roles-invite-section")).toHaveAttribute("open");
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
    expect(within(keysPanel).getByRole("link", { name: "API keys" })).toHaveAttribute("href", "/administration/api-keys");
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
});
