import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/getting-started",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpGettingStartedGuideView } from "@/app/(operator)/help/_sections/HelpGettingStartedGuideView";
import {
  GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER,
  GETTING_STARTED_HELP_PAGE_SUBTITLE_OPERATOR,
} from "@/lib/getting-started-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGettingStartedGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("getting-started");

  it("uses buyer subtitle, breadcrumb, claim discipline, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    expect(screen.getByText(GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(GETTING_STARTED_HELP_PAGE_SUBTITLE_OPERATOR)).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-getting-started-claim-discipline")).toBeInTheDocument();
    expect(screen.queryByTestId("help-getting-started-sources")).toBeNull();
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("pilot-guide-getting-started-first-review-vocabulary")).toBeNull();
    expect(screen.getByTestId("getting-started-quick-start-card")).toBeInTheDocument();
  });
});
