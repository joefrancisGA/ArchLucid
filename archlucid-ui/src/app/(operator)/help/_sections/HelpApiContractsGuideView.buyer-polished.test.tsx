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

import { HelpApiContractsGuideView } from "@/app/(operator)/help/_sections/HelpApiContractsGuideView";
import { API_CONTRACTS_HELP_PRIMARY_ACTIONS } from "@/lib/api-contracts-help-guide-content";
import {
  API_CONTRACTS_HELP_CLAIM_DISCIPLINE,
  API_CONTRACTS_HELP_FOLLOW_UPS_TITLE,
  API_CONTRACTS_HELP_SOURCES,
} from "@/lib/api-contracts-help-evidence-copy";
import {
  API_CONTRACTS_HELP_FIRST_VIEWPORT_TEST_ID,
  API_CONTRACTS_HELP_SKIP_LINK_LABEL,
  API_CONTRACTS_HELP_SKIP_TARGET_ID,
} from "@/lib/api-contracts-help-page-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpApiContractsGuideView buyer-polished shell (HG)", () => {
  const entry = getProductDocumentationEntry("api-contracts");
  const loaded = tryLoadProductDocumentation("api-contracts");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected api-contracts documentation to load.");
    }

    render(<HelpApiContractsGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: API_CONTRACTS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${API_CONTRACTS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-api-contracts-header-claim-discipline")).toHaveTextContent(
      API_CONTRACTS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-api-contracts-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: API_CONTRACTS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-api-contracts-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-setup-config-hubs-vocabulary")).toBeNull();

    const primaryContent = screen.getByTestId("help-api-contracts-primary-content");
    const firstViewport = screen.getByTestId(API_CONTRACTS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-api-contracts-action-panel");
    const orientationBottom = screen.getByTestId("help-api-contracts-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-api-contracts-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      screen.getByTestId("help-api-contracts-primary-cta"),
    ).toHaveAttribute("href", API_CONTRACTS_HELP_PRIMARY_ACTIONS.openOpenApi.href);

    for (const source of API_CONTRACTS_HELP_SOURCES) {
      expect(
        within(sourcesSection).getByRole("link", { name: `Read ${source.label}` }),
      ).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
