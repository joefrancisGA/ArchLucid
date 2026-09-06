import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/developer",
  });
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

import { DeveloperSettingsPageClient } from "@/app/(operator)/administration/developer/DeveloperSettingsPageClient";
import { INTERNAL_DEVELOPER_TOOLS_INTRO, INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE } from "@/app/(operator)/administration/developer/developer-settings-copy";
import {
  DEVELOPER_SETTINGS_CLAIM_DISCIPLINE,
  DEVELOPER_SETTINGS_FOLLOW_UPS_TITLE,
  DEVELOPER_SETTINGS_SOURCES,
} from "@/lib/developer-settings-evidence-copy";
import {
  DEVELOPER_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  DEVELOPER_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  DEVELOPER_SETTINGS_PAGE_SUBTITLE_BUYER,
  DEVELOPER_SETTINGS_PRIMARY_CONTENT_ID,
  DEVELOPER_SETTINGS_SKIP_LINK_LABEL,
  DEVELOPER_SETTINGS_SKIP_TARGET_ID,
  DEVELOPER_SETTINGS_BUYER_START_HERE_HELPER,
  DEVELOPER_SETTINGS_PAGE_LEAD,
  DEVELOPER_SETTINGS_START_HERE_CARD_TITLE,
} from "@/lib/developer-settings-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("DeveloperSettingsPageClient buyer-polished shell (SDX)", () => {
  it("renders skip link, tools before follow-ups, header claim discipline, and hides contextual help", () => {
    render(<DeveloperSettingsPageClient />);

    expect(screen.getByRole("link", { name: DEVELOPER_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DEVELOPER_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(DEVELOPER_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(INTERNAL_DEVELOPER_TOOLS_INTRO)).not.toBeInTheDocument();
    expect(screen.getByTestId("developer-settings-intro")).toHaveTextContent(DEVELOPER_SETTINGS_PAGE_LEAD);
    expect(screen.getByTestId("developer-settings-buyer-start-here-helper")).toHaveTextContent(
      DEVELOPER_SETTINGS_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: DEVELOPER_SETTINGS_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("try-cli-demo-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("authority-theme-option-default")).not.toBeInTheDocument();
    expect(screen.getByTestId(DEVELOPER_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      DEVELOPER_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("developer-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Page help" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("developer-api-contracts-api-keys-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("try-cli-demo-cli-help-link")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: DEVELOPER_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(DEVELOPER_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(DEVELOPER_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("developer-settings-orientation-bottom");
    const sourcesSection = screen.getByTestId("developer-settings-sources");
    const buildIdentityCard = screen.getByTestId("developer-settings-build-identity-card");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(buildIdentityCard);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(DEVELOPER_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
