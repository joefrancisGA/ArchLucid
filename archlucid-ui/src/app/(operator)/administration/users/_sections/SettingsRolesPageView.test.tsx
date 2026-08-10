import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/administration/users",
  useRouter: (): { push: () => void; replace: () => void; refresh: () => void } => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

vi.mock("@/lib/api-keys-settings-access", () => ({
  isApiKeysSettingsSurfaceEnabled: () => false,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 3,
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

import { SettingsRolesPageView } from "./SettingsRolesPageView";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

function buildModel(overrides: Partial<SettingsRolesPageViewModel> = {}): SettingsRolesPageViewModel {
  return {
    surface: "admin",
    loading: false,
    sortedRows: [],
    note: "api_unavailable",
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
    render(<SettingsRolesPageView model={buildModel({ note: null })} />);

    expect(screen.getByTestId("settings-roles-invite-primary-action")).toHaveTextContent("Invite user");
    expect(screen.getByRole("heading", { level: 2, name: /Members/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Pending invitations" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Invite user" })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("settings-roles-invite-primary-action"));

    expect(screen.getByTestId("settings-roles-invite-section")).toHaveAttribute("open");
  });
});
