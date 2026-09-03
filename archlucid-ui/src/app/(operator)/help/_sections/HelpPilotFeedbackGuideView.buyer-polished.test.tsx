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

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpPilotFeedbackGuideView } from "@/app/(operator)/help/_sections/HelpPilotFeedbackGuideView";
import {
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE,
  PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE,
  PILOT_FEEDBACK_HELP_SOURCES,
} from "@/lib/pilot-feedback-help-evidence-copy";
import { PILOT_FEEDBACK_HELP_PRIMARY_ACTION } from "@/lib/pilot-feedback-help-guide-content";
import {
  PILOT_FEEDBACK_HELP_FIRST_VIEWPORT_TEST_ID,
  PILOT_FEEDBACK_HELP_PRIMARY_CONTENT_ID,
  PILOT_FEEDBACK_HELP_SKIP_LINK_LABEL,
  PILOT_FEEDBACK_HELP_SKIP_TARGET_ID,
} from "@/lib/pilot-feedback-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpPilotFeedbackGuideView buyer-polished shell (HPE)", () => {
  const loaded = tryLoadProductDocumentation("pilot-feedback");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected pilot-feedback documentation to load.");
    }

    render(<HelpPilotFeedbackGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: PILOT_FEEDBACK_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PILOT_FEEDBACK_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-pilot-feedback-header-claim-discipline")).toHaveTextContent(
      PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-pilot-feedback-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-pilot-feedback-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-pilot-feedback-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(PILOT_FEEDBACK_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(PILOT_FEEDBACK_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-pilot-feedback-action-panel");
    const orientationBottom = screen.getByTestId("help-pilot-feedback-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-pilot-feedback-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-pilot-feedback-primary-cta")).toHaveAttribute(
      "href",
      PILOT_FEEDBACK_HELP_PRIMARY_ACTION.href,
    );

    for (const source of filterWhereToGoNextFollowUpLinks(PILOT_FEEDBACK_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
