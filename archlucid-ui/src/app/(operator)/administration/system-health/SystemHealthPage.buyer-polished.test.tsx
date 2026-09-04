import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await extendBuyerPolishedShellVitestMock(importOriginal);

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: vi.fn(() => false),
  };
});

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: () => false,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import SystemHealthPage from "@/app/(operator)/administration/system-health/page";
import {
  SYSTEM_HEALTH_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_FOLLOW_UPS_TITLE,
  SYSTEM_HEALTH_SOURCES,
} from "@/lib/system-health-evidence-copy";
import {
  SYSTEM_HEALTH_FIRST_VIEWPORT_TEST_ID,
  SYSTEM_HEALTH_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER,
  SYSTEM_HEALTH_PRIMARY_CONTENT_ID,
  SYSTEM_HEALTH_SKIP_LINK_LABEL,
  SYSTEM_HEALTH_SKIP_TARGET_ID,
} from "@/lib/system-health-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("System health buyer-polished shell (ADY)", () => {
  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
  });

  it("renders skip link, demo workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    buyerPolishedShellVitestOverride.value = true;

    render(<SystemHealthPage />);

    expect(screen.getByRole("link", { name: SYSTEM_HEALTH_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SYSTEM_HEALTH_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId(SYSTEM_HEALTH_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SYSTEM_HEALTH_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("system-health-operator-claim-scope")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SYSTEM_HEALTH_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("system-health-demo-page")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(SYSTEM_HEALTH_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SYSTEM_HEALTH_FIRST_VIEWPORT_TEST_ID);
    const demoOverall = screen.getByTestId("system-health-demo-overall-badge");
    const orientationBottom = screen.getByTestId("system-health-orientation-bottom");
    const sourcesSection = screen.getByTestId("system-health-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(demoOverall);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(SYSTEM_HEALTH_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
