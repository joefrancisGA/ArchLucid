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

import { HelpEvidenceIntakeGuideView } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeGuideView";
import {
  EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_INTAKE_HELP_FOLLOW_UPS_TITLE,
  EVIDENCE_INTAKE_HELP_PRIMARY_ACTION,
  EVIDENCE_INTAKE_HELP_SOURCES,
} from "@/lib/evidence-intake-help-evidence-copy";
import {
  EVIDENCE_INTAKE_HELP_FIRST_VIEWPORT_TEST_ID,
  EVIDENCE_INTAKE_HELP_PRIMARY_CONTENT_ID,
  EVIDENCE_INTAKE_HELP_SKIP_LINK_LABEL,
  EVIDENCE_INTAKE_HELP_SKIP_TARGET_ID,
} from "@/lib/evidence-intake-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpEvidenceIntakeGuideView buyer-polished shell (EVI)", () => {
  const loaded = tryLoadProductDocumentation("evidence-intake");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected evidence-intake documentation to load.");
    }

    render(<HelpEvidenceIntakeGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: EVIDENCE_INTAKE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${EVIDENCE_INTAKE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-evidence-intake-header-claim-discipline")).toHaveTextContent(
      EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("evidence-intake-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: EVIDENCE_INTAKE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-evidence-intake-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(EVIDENCE_INTAKE_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(EVIDENCE_INTAKE_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-evidence-intake-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-evidence-intake-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      screen.getByTestId(EVIDENCE_INTAKE_HELP_PRIMARY_ACTION.testId),
    ).toHaveAttribute("href", EVIDENCE_INTAKE_HELP_PRIMARY_ACTION.href);

    for (const source of EVIDENCE_INTAKE_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
