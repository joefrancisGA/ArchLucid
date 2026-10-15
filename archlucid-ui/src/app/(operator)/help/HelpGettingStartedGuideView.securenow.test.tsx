import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

import { HelpGettingStartedGuideView } from "@/app/(operator)/help/_sections/HelpGettingStartedGuideView";
import {
  SECURENOW_GETTING_STARTED_HELP_QUICK_START_TITLE,
  SECURENOW_GETTING_STARTED_HELP_WORKFLOW_SECTION_INTRO,
} from "@/lib/getting-started-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGettingStartedGuideView SecureNow shell", () => {
  const entry = getProductDocumentationEntry("getting-started");

  it("orients operators without architecture-review pilot rails or CTAs", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    expect(screen.getByText(SECURENOW_GETTING_STARTED_HELP_QUICK_START_TITLE)).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_GETTING_STARTED_HELP_WORKFLOW_SECTION_INTRO)).toBeInTheDocument();
    expect(screen.queryByTestId("pilot-guide-getting-started-first-review-vocabulary")).toBeNull();
    expect(screen.queryByTestId("getting-started-evaluating-architecture-section")).toBeNull();
    expect(screen.queryByRole("link", { name: /start a review/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /first architecture review/i })).toBeNull();
  });
});
