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

import { HelpCliUsageTechnicalReferenceView } from "@/app/(operator)/help/_sections/HelpCliUsageTechnicalReferenceView";
import { CLI_USAGE_HELP_PRIMARY_ACTIONS } from "@/lib/cli-usage-help-guide-content";
import {
  CLI_USAGE_HELP_CLAIM_DISCIPLINE,
  CLI_USAGE_HELP_FOLLOW_UPS_TITLE,
  CLI_USAGE_HELP_SOURCES,
} from "@/lib/cli-usage-help-evidence-copy";
import {
  CLI_USAGE_HELP_FIRST_VIEWPORT_TEST_ID,
  CLI_USAGE_HELP_SKIP_LINK_LABEL,
  CLI_USAGE_HELP_SKIP_TARGET_ID,
} from "@/lib/cli-usage-help-page-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpCliUsageTechnicalReferenceView buyer-polished shell (HCX)", () => {
  const entry = getProductDocumentationEntry("cli-usage");
  const loaded = tryLoadProductDocumentation("cli-usage");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected cli-usage documentation to load.");
    }

    render(<HelpCliUsageTechnicalReferenceView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: CLI_USAGE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CLI_USAGE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-cli-usage-header-claim-discipline")).toHaveTextContent(
      CLI_USAGE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CLI_USAGE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-cli-usage-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-cli-usage-primary-content");
    const firstViewport = screen.getByTestId(CLI_USAGE_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-cli-usage-action-panel");
    const orientationBottom = screen.getByTestId("help-cli-usage-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-cli-usage-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-cli-usage-primary-cta")).toHaveAttribute(
      "href",
      CLI_USAGE_HELP_PRIMARY_ACTIONS.openTroubleshooting.href,
    );

    const visibleSources = CLI_USAGE_HELP_SOURCES.filter((source) => !source.href.startsWith("/administration/"));

    for (const source of visibleSources) {
      expect(
        within(sourcesSection).getByRole("link", { name: `Read ${source.label}` }),
      ).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
