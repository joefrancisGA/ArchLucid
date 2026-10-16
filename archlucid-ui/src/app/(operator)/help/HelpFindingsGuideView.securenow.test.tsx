import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpFindingsWorkspaceReadinessStrip", () => ({
  HelpFindingsWorkspaceReadinessStrip: () => null,
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

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/findings",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HelpFindingsGuideView } from "@/app/(operator)/help/_sections/HelpFindingsGuideView";
import {
  SECURENOW_FINDINGS_HELP_OVERVIEW,
  SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE,
} from "@/lib/findings/findings-help-guide-content";
import {
  FINDINGS_HELP_ASSIGNED_TO_ME_SECTION_ID,
  SECURENOW_FINDINGS_HELP_ASSIGNED_TO_ME_INTRO,
} from "@/lib/findings/findings-help-assigned-to-me-section";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpFindingsGuideView SecureNow shell", () => {
  const entry = getProductDocumentationEntry("findings");

  it("orients operators without architecture-review CTAs", () => {
    if (entry === undefined) {
      throw new Error("Expected findings documentation entry.");
    }

    render(<HelpFindingsGuideView entry={entry} />);

    expect(screen.getByText(SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_FINDINGS_HELP_OVERVIEW)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open assigned to me" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Open policy packs" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Search review evidence" })).toBeNull();
    expect(screen.queryByRole("link", { name: /decision register/i })).toBeNull();
    expect(screen.queryByText(/architecture concern identified during a review/i)).toBeNull();
  });

  it("includes assigned-to-me help section for Learn more deep links", () => {
    if (entry === undefined) {
      throw new Error("Expected findings documentation entry.");
    }

    render(<HelpFindingsGuideView entry={entry} />);

    expect(document.getElementById(FINDINGS_HELP_ASSIGNED_TO_ME_SECTION_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-findings-assigned-to-me")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_FINDINGS_HELP_ASSIGNED_TO_ME_INTRO)).toBeInTheDocument();
    const assignedSection = screen.getByTestId("help-findings-assigned-to-me");
    expect(within(assignedSection).getByRole("link", { name: "Open assigned to me" })).toHaveAttribute(
      "href",
      "/security/assigned-to-me",
    );
  });
});
