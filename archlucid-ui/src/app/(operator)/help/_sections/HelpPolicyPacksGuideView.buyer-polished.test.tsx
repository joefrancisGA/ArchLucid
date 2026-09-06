import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: () => null,
}));

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

import { HelpPolicyPacksGuideView } from "@/app/(operator)/help/_sections/HelpPolicyPacksGuideView";
import {
  POLICY_PACKS_HELP_CLAIM_DISCIPLINE,
  POLICY_PACKS_HELP_FOLLOW_UPS_TITLE,
  POLICY_PACKS_HELP_PRIMARY_ACTION,
  POLICY_PACKS_HELP_SOURCES,
} from "@/lib/policy/policy-packs-help-evidence-copy";
import {
  POLICY_PACKS_HELP_FIRST_VIEWPORT_TEST_ID,
  POLICY_PACKS_HELP_PRIMARY_CONTENT_ID,
  POLICY_PACKS_HELP_SKIP_LINK_LABEL,
  POLICY_PACKS_HELP_SKIP_TARGET_ID,
} from "@/lib/policy/policy-packs-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpPolicyPacksGuideView buyer-polished shell (HEO)", () => {
  const loaded = tryLoadProductDocumentation("policy-packs");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected policy-packs documentation to load.");
    }

    render(<HelpPolicyPacksGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: POLICY_PACKS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${POLICY_PACKS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-policy-packs-header-claim-discipline")).toHaveTextContent(
      POLICY_PACKS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("policy-packs-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: POLICY_PACKS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-policy-packs-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-policy-packs-mermaid-diagram")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(POLICY_PACKS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(POLICY_PACKS_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-policy-packs-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-policy-packs-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      screen.getByTestId(POLICY_PACKS_HELP_PRIMARY_ACTION.testId),
    ).toHaveAttribute("href", POLICY_PACKS_HELP_PRIMARY_ACTION.href);

    for (const source of POLICY_PACKS_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
