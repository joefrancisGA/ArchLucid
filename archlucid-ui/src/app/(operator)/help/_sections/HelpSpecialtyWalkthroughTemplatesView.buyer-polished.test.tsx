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

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: vi.fn(() => true),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/hooks/use-review-intake-navigation", () => ({
  useReviewIntakeNavigation: () => ({
    navigate: vi.fn(),
    isNavigating: false,
    loadingLabel: "Preparing architecture review…",
    showStagedPanel: false,
    activeStageId: null,
    stages: [],
    error: null,
    stalled: false,
    stalledHref: null,
  }),
}));

import { HelpSpecialtyWalkthroughTemplatesView } from "@/app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE,
  SPECIALTY_WALKTHROUGHS_HELP_FOLLOW_UPS_TITLE,
  SPECIALTY_WALKTHROUGHS_HELP_SOURCES,
} from "@/lib/specialty-walkthroughs-help-evidence-copy";
import { SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION } from "@/lib/specialty-walkthroughs-help-guide-content";
import {
  SPECIALTY_WALKTHROUGHS_HELP_FIRST_VIEWPORT_TEST_ID,
  SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_CONTENT_ID,
  SPECIALTY_WALKTHROUGHS_HELP_SKIP_LINK_LABEL,
  SPECIALTY_WALKTHROUGHS_HELP_SKIP_TARGET_ID,
} from "@/lib/specialty-walkthroughs-help-page-copy";

describe("HelpSpecialtyWalkthroughTemplatesView buyer-polished shell (HS)", () => {
  const entry = getProductDocumentationEntry("specialty-walkthroughs");

  it("renders skip link, first-viewport band, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected specialty-walkthroughs documentation entry.");
    }

    render(<HelpSpecialtyWalkthroughTemplatesView entry={entry} />);

    expect(screen.getByRole("link", { name: SPECIALTY_WALKTHROUGHS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SPECIALTY_WALKTHROUGHS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-specialty-walkthroughs-header-claim-discipline")).toHaveTextContent(
      SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-specialty-walkthroughs-buyer-provenance")).toHaveTextContent(
      "Template catalog last reviewed 2026-05-01",
    );
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SPECIALTY_WALKTHROUGHS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-specialty-walkthroughs-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SPECIALTY_WALKTHROUGHS_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-specialty-walkthroughs-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-specialty-walkthroughs-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId(SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION.label })).toHaveLength(1);

    const skipTarget = document.getElementById(SPECIALTY_WALKTHROUGHS_HELP_SKIP_TARGET_ID);

    expect(skipTarget).not.toBeNull();
    expect(skipTarget?.tabIndex).toBe(-1);

    for (const source of SPECIALTY_WALKTHROUGHS_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
