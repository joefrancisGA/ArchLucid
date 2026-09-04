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
  usePathname: () => "/help/caiq-sig-response",
}));

import { HelpCaiqSigResponseGuideView } from "@/app/(operator)/help/_sections/HelpCaiqSigResponseGuideView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE,
  CAIQ_SIG_RESPONSE_HELP_FOLLOW_UPS_TITLE,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import {
  CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS,
} from "@/lib/caiq-sig-response-help-guide-content";
import {
  CAIQ_SIG_RESPONSE_HELP_FIRST_VIEWPORT_TEST_ID,
  CAIQ_SIG_RESPONSE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CAIQ_SIG_RESPONSE_HELP_SKIP_LINK_LABEL,
  CAIQ_SIG_RESPONSE_HELP_SKIP_TARGET_ID,
} from "@/lib/caiq-sig-response-help-page-copy";

describe("HelpCaiqSigResponseGuideView buyer-polished shell (ECA)", () => {
  const loaded = tryLoadProductDocumentation("caiq-sig-response");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    render(<HelpCaiqSigResponseGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: CAIQ_SIG_RESPONSE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CAIQ_SIG_RESPONSE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(CAIQ_SIG_RESPONSE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-caiq-sig-response-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("caiq-sig-response-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("caiq-sig-response-help-lead")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-caiq-sig-response-header-actions")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CAIQ_SIG_RESPONSE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-caiq-sig-response-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-caiq-sig-response-primary-content");
    const firstViewport = screen.getByTestId(CAIQ_SIG_RESPONSE_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-caiq-sig-response-action-panel");
    const orientationBottom = screen.getByTestId("help-caiq-sig-response-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-caiq-sig-response-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openTrustCenter.label }),
    ).toHaveAttribute("href", CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openTrustCenter.href);

    for (const source of CAIQ_SIG_RESPONSE_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.getByTestId("caiq-sig-response-help-posture-summary")).toBeInTheDocument();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
