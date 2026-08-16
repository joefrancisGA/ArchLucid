import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/ProductConceptsGlossaryDialog", () => ({
  ProductConceptsGlossaryDialog: () => null,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({ callerAuthorityRank: 1, isAuthorityLoading: false }),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => "/architecture/reviews",
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import { HelpSearchPanel } from "@/components/HelpSearchPanel";
import { CONTEXTUAL_HELP_DRAWER_CLAIM_DISCIPLINE } from "@/lib/contextual-help-drawer-evidence-copy";
import { HELP_SEARCH_PANEL_SUBTITLE } from "@/lib/help/help-search-panel-catalog";

describe("HelpSearchPanel buyer-polished shell (HCD)", () => {
  it("uses breadcrumb, buyer subtitle, and claim orientation strip", () => {
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByTestId("contextual-help-drawer-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-search-panel-subtitle")).toHaveTextContent(HELP_SEARCH_PANEL_SUBTITLE);
    expect(screen.getByText(CONTEXTUAL_HELP_DRAWER_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByTestId("help-search-panel")).toBeInTheDocument();
  });
});
