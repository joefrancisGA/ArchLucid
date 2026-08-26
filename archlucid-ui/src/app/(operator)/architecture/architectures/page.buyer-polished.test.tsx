import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/architecture/ArchitectureDraftListClient", () => ({
  ArchitectureDraftListClient: () => <div data-testid="architecture-draft-list" />,
}));

vi.mock("./_sections/ArchitecturesHubHeaderActions", () => ({
  ArchitecturesHubHeaderActions: () => <div data-testid="architectures-hub-header-actions" />,
}));

import ArchitecturesListPage from "./page";
import { ARCHITECTURES_LIST_CLAIM_DISCIPLINE } from "@/lib/architectures-list-evidence-copy";
import {
  ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER,
  ARCHITECTURES_HUB_PAGE_TITLE,
} from "@/lib/architectures-hub-copy";

describe("ArchitecturesListPage buyer-polished shell", () => {
  it("renders breadcrumb, buyer subtitle, and claim discipline in page header", () => {
    render(<ArchitecturesListPage />);

    expect(screen.getByTestId("architectures-hub-page-title")).toHaveTextContent(ARCHITECTURES_HUB_PAGE_TITLE);
    expect(screen.getByText(ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("architectures-hub-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("architectures-hub-claim-discipline").textContent).toContain(
      ARCHITECTURES_LIST_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("architecture-draft-list")).toBeInTheDocument();

    const draftList = screen.getByTestId("architecture-draft-list");
    const claimDiscipline = screen.getByTestId("architectures-hub-claim-discipline");

    expect(claimDiscipline.compareDocumentPosition(draftList) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
