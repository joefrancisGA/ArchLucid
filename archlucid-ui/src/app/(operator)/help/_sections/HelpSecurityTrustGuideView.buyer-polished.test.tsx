import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/security-trust",
}));

import { HelpSecurityTrustGuideView } from "@/app/(operator)/help/_sections/HelpSecurityTrustGuideView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
  SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE,
  SECURITY_TRUST_HELP_PRIMARY_ACTION,
  SECURITY_TRUST_HELP_SOURCES,
} from "@/lib/security-trust-help-evidence-copy";
import {
  SECURITY_TRUST_HELP_FIRST_VIEWPORT_TEST_ID,
  SECURITY_TRUST_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SECURITY_TRUST_HELP_SKIP_LINK_LABEL,
  SECURITY_TRUST_HELP_SKIP_TARGET_ID,
} from "@/lib/security-trust-help-page-copy";
import { TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF } from "@/lib/trust-center-public-assurance";

describe("HelpSecurityTrustGuideView buyer-polished shell (HSE)", () => {
  const loaded = tryLoadProductDocumentation("security-trust");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    render(<HelpSecurityTrustGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: SECURITY_TRUST_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SECURITY_TRUST_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(SECURITY_TRUST_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SECURITY_TRUST_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-security-trust-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("security-trust-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-security-trust-header-actions")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-security-trust-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-security-trust-primary-content");
    const firstViewport = screen.getByTestId(SECURITY_TRUST_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-security-trust-action-panel");
    const orientationBottom = screen.getByTestId("help-security-trust-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-security-trust-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: SECURITY_TRUST_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF);

    for (const source of SECURITY_TRUST_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.getByTestId("security-trust-help-posture-summary")).toBeInTheDocument();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
