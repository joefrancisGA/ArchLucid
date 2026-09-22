import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpArchitectureDraftEditingGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureDraftEditingGuideView";
import {
  ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_TITLE,
  ARCHITECTURE_DRAFT_EDITING_HELP_PAGE_TITLE,
  ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_ACTION,
} from "@/lib/architecture/architecture-draft-editing-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureDraftEditingGuideView (LW-094)", () => {
  const entry = getProductDocumentationEntry("architecture-draft-editing");

  it("renders lease, conflict, and boundary sections without live presence language", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-draft-editing documentation entry.");
    }

    render(<HelpArchitectureDraftEditingGuideView entry={entry} markdown="" />);

    expect(screen.getByTestId("help-architecture-draft-editing-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-draft-editing-page-title")).toHaveTextContent(
      ARCHITECTURE_DRAFT_EDITING_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-architecture-draft-editing-lease")).toHaveTextContent(/not live presence/i);
    expect(screen.getByTestId("help-architecture-draft-editing-conflict")).toHaveTextContent(/keep mine/i);
    expect(screen.getByRole("heading", { name: ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_ACTION.href,
    );
  });
});
