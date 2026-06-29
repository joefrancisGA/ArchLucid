import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SETTINGS_ROLES_USERS_TAB_PATH } from "@/lib/invite-reviewer-flow";

import { InviteReviewerPageView } from "./InviteReviewerPageView";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("./SettingsRolesInvitePanel", () => ({
  SettingsRolesInvitePanel: () => <div data-testid="settings-roles-invite-panel-mock" />,
}));

function buildModel(overrides: Partial<SettingsRolesPageViewModel> = {}): SettingsRolesPageViewModel {
  return {
    surface: "admin",
    loading: false,
    sortedRows: [],
    note: null,
    load: async () => {},
    onRoleChange: async () => {},
    ...overrides,
  };
}

describe("InviteReviewerPageView", () => {
  it("uses buyer-safe footer copy without API keys", () => {
    render(<InviteReviewerPageView model={buildModel()} />);

    expect(screen.getByTestId("invite-reviewer-footer")).toHaveTextContent("Need to manage users or permissions?");
    expect(screen.getByRole("link", { name: "Open Users and roles" })).toHaveAttribute(
      "href",
      SETTINGS_ROLES_USERS_TAB_PATH,
    );
    expect(screen.queryByText(/API keys/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/custom roles/i)).not.toBeInTheDocument();
  });

  it("hides the footer when the user directory is unavailable", () => {
    render(<InviteReviewerPageView model={buildModel({ note: "api_unavailable" })} />);

    expect(screen.queryByTestId("invite-reviewer-footer")).not.toBeInTheDocument();
  });
});
