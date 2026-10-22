import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/administration/security-trust",
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => <div data-testid="help-topic-pdf-download-button" />,
}));

import { OperatorSecurityTrustPageView } from "@/app/(operator)/administration/security-trust/_sections/OperatorSecurityTrustPageView";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  OPERATOR_SECURITY_TRUST_NDA_REQUEST_LABEL,
} from "@/lib/operator/operator-security-trust-content";
import {
  OPERATOR_SECURITY_TRUST_BUYER_START_HERE_HELPER,
  OPERATOR_SECURITY_TRUST_FIRST_VIEWPORT_TEST_ID,
  OPERATOR_SECURITY_TRUST_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION,
  OPERATOR_SECURITY_TRUST_PAGE_LEAD,
  OPERATOR_SECURITY_TRUST_PAGE_SUBTITLE_BUYER,
  OPERATOR_SECURITY_TRUST_PRIMARY_CONTENT_ID,
  OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_LABEL,
  OPERATOR_SECURITY_TRUST_SKIP_LINK_LABEL,
  OPERATOR_SECURITY_TRUST_SKIP_TARGET_ID,
  OPERATOR_SECURITY_TRUST_START_HERE_CARD_TITLE,
} from "@/lib/operator/operator-security-trust-page-copy";
import {
  SETTINGS_SECURITY_TRUST_CLAIM_DISCIPLINE,
  SETTINGS_SECURITY_TRUST_FOLLOW_UPS_TITLE,
  SETTINGS_SECURITY_TRUST_SOURCES,
} from "@/lib/settings-security-trust-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("OperatorSecurityTrustPageView buyer-polished shell (WSX)", () => {
  it("renders skip link, materials before follow-ups, header claim discipline, and hides operator chrome", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByRole("link", { name: OPERATOR_SECURITY_TRUST_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${OPERATOR_SECURITY_TRUST_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(OPERATOR_SECURITY_TRUST_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION)).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-security-trust-intro")).toHaveTextContent(OPERATOR_SECURITY_TRUST_PAGE_LEAD);
    expect(screen.getByTestId("operator-security-trust-buyer-start-here-helper")).toHaveTextContent(
      OPERATOR_SECURITY_TRUST_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: OPERATOR_SECURITY_TRUST_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Page help" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("security-trust-related-surfaces-disclosure")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-pdf-download-button")).not.toBeInTheDocument();
    expect(screen.queryByText(OPERATOR_SECURITY_TRUST_NDA_REQUEST_LABEL)).not.toBeInTheDocument();
    expect(screen.getByTestId(OPERATOR_SECURITY_TRUST_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SETTINGS_SECURITY_TRUST_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("settings-security-trust-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SETTINGS_SECURITY_TRUST_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: OPERATOR_NAV_LINK_LABELS.securityTrust })).toBeInTheDocument();
    expect(screen.getByTestId("security-trust-primary-trust-center")).toHaveTextContent(
      OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_LABEL,
    );

    const primaryContent = screen.getByTestId(OPERATOR_SECURITY_TRUST_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(OPERATOR_SECURITY_TRUST_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("operator-security-trust-orientation-bottom");
    const sourcesSection = screen.getByTestId("settings-security-trust-sources");
    const materialsTable = screen.getByTestId("security-trust-materials-table");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(materialsTable);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(SETTINGS_SECURITY_TRUST_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
