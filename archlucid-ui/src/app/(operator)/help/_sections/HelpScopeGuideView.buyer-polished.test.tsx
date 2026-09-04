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

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({
    tenantId: "11111111-1111-1111-1111-111111111111",
    workspaceId: "22222222-2222-2222-2222-222222222222",
    projectId: "33333333-3333-3333-3333-333333333333",
  }),
}));

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...mod,
    readOperatorScopeFromStorage: vi.fn(() => null),
  };
});

import { HelpScopeGuideView } from "@/app/(operator)/help/_sections/HelpScopeGuideView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  SCOPE_HELP_CLAIM_DISCIPLINE,
  SCOPE_HELP_FOLLOW_UPS_TITLE,
  SCOPE_HELP_PRIMARY_ACTION,
  SCOPE_HELP_SOURCES,
} from "@/lib/scope-help-evidence-copy";
import {
  SCOPE_HELP_FIRST_VIEWPORT_TEST_ID,
  SCOPE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SCOPE_HELP_SKIP_LINK_LABEL,
  SCOPE_HELP_SKIP_TARGET_ID,
} from "@/lib/scope-help-page-copy";

describe("HelpScopeGuideView buyer-polished shell (HSX)", () => {
  const loaded = tryLoadProductDocumentation("scope");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpScopeGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: SCOPE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SCOPE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(SCOPE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SCOPE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-scope-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scope-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-scope-header-actions")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SCOPE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-scope-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-scope-primary-content");
    const firstViewport = screen.getByTestId(SCOPE_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-scope-action-panel");
    const scopePanel = screen.getByTestId("scope-help-current-scope-panel");
    const orientationBottom = screen.getByTestId("help-scope-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-scope-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(scopePanel);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: SCOPE_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", SCOPE_HELP_PRIMARY_ACTION.href);

    for (const source of SCOPE_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
