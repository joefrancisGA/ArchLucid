import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./SettingsRolesInvitePanel", () => ({
  SettingsRolesInvitePanel: () => <div data-testid="settings-roles-invite-panel-mock" />,
}));

import { INVITE_REVIEWER_CLAIM_DISCIPLINE } from "@/lib/invite-reviewer-evidence-copy";

import { InviteReviewerPageView } from "./InviteReviewerPageView";
import {
  INVITE_REVIEWER_PAGE_SUBTITLE_BUYER,
} from "./invite-reviewer-page-copy";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

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

describe("InviteReviewerPageView buyer-polished shell", () => {
  it("renders breadcrumb, buyer subtitle, claim strip, and hides contextual help", () => {
    render(<InviteReviewerPageView model={buildModel()} />);

    expect(screen.getByTestId("invite-reviewer-claim-discipline").textContent).toContain(
      INVITE_REVIEWER_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(INVITE_REVIEWER_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("invite-reviewer-reader-capabilities")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-invite-panel-mock")).toBeInTheDocument();
  });
});
