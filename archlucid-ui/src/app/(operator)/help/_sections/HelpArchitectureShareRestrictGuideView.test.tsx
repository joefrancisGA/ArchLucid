import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpArchitectureShareRestrictGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureShareRestrictGuideView";
import {
  ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_TITLE,
  ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_TITLE,
  ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION,
} from "@/lib/architecture/architecture-share-restrict-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureShareRestrictGuideView (AS-098)", () => {
  const entry = getProductDocumentationEntry("architecture-sharing");

  it("renders share role tiles and product boundary copy", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-sharing documentation entry.");
    }

    render(<HelpArchitectureShareRestrictGuideView entry={entry} />);

    expect(screen.getByTestId("help-architecture-sharing-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-sharing-page-title")).toHaveTextContent(
      ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-architecture-sharing-role-tile-view")).toHaveTextContent("View");
    expect(screen.getByTestId("help-architecture-sharing-role-tile-decide")).toHaveTextContent("Decide");
    expect(screen.getByTestId("help-architecture-sharing-role-tile-admin")).toHaveTextContent("Admin");
    expect(screen.getByTestId("help-architecture-sharing-boundary")).toHaveTextContent(/chat/i);
    expect(screen.getByRole("heading", { name: ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION.href,
    );
  });
});
