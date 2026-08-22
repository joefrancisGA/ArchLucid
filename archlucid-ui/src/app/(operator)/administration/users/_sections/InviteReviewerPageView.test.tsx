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
    usersNote: null,
    keysNote: null,
    usersDirectorySource: "manual",
    load: async () => {},
    onRoleChange: async () => "saved",
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

  it("keeps the footer when the user directory is unavailable (invite does not need directory)", () => {
    render(<InviteReviewerPageView model={buildModel({ usersNote: "api_unavailable" })} />);

    expect(screen.getByTestId("invite-reviewer-footer")).toBeInTheDocument();
  });

  it("shows Reader role capability summary below the page lead (TB-511)", () => {
    render(<InviteReviewerPageView model={buildModel()} />);

    expect(screen.getByTestId("invite-reviewer-reader-capabilities")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reader role capabilities:" })).toBeInTheDocument();
    expect(screen.getByText("View reviews, findings, and approval decisions")).toBeInTheDocument();
    expect(screen.getByText("Export finalized review records and audit CSVs")).toBeInTheDocument();
    expect(screen.getByText("Cannot approve pending requests")).toBeInTheDocument();
    expect(screen.getByText("Cannot finalize reviews")).toBeInTheDocument();
    expect(screen.getByText("Cannot modify evidence or review settings")).toBeInTheDocument();
  });
});
