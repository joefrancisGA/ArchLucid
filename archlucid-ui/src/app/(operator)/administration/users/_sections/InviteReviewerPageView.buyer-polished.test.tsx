import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { INVITE_REVIEWER_CLAIM_DISCIPLINE, INVITE_REVIEWER_SOURCES } from "@/lib/invite-reviewer-evidence-copy";

import { InviteReviewerPageView } from "./InviteReviewerPageView";
import {
  INVITE_REVIEWER_FIRST_VIEWPORT_TEST_ID,
  INVITE_REVIEWER_PAGE_SUBTITLE_BUYER,
  INVITE_REVIEWER_PRIMARY_CONTENT_ID,
  INVITE_REVIEWER_SKIP_LINK_LABEL,
  INVITE_REVIEWER_SKIP_TARGET_ID,
} from "./invite-reviewer-page-copy";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

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

const proxyJsonGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: proxyJsonGetMock,
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

describe("InviteReviewerPageView buyer-polished shell (SRI)", () => {
  it("renders skip link, first-viewport band, orientation above invite panel, and Sources links", () => {
    proxyJsonGetMock.mockResolvedValueOnce({
      operatorBaseUrlConfigured: true,
      localTrialIdentityConfigured: true,
    });

    render(<InviteReviewerPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: INVITE_REVIEWER_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${INVITE_REVIEWER_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("invite-reviewer-primary-content")).toHaveAttribute(
      "id",
      INVITE_REVIEWER_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("invite-reviewer-claim-discipline").textContent).toContain(
      INVITE_REVIEWER_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(INVITE_REVIEWER_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("invite-reviewer-reader-capabilities")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Where to go next" })).toBeInTheDocument();

    const primaryContent = screen.getByTestId("invite-reviewer-primary-content");
    const firstViewport = screen.getByTestId(INVITE_REVIEWER_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("invite-reviewer-orientation-top");
    const invitePanel = screen.getByTestId("settings-roles-invite-panel-mock");
    const sourcesSection = screen.getByTestId("invite-reviewer-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(invitePanel);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(invitePanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(INVITE_REVIEWER_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
