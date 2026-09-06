import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/architecture/ArchitectureDraftWorkspace", () => ({
  ArchitectureDraftWorkspace: () => <div data-testid="architecture-draft-workspace" />,
}));

vi.mock("./_sections/ArchitecturesNewPageHeaderActions", () => ({
  ArchitecturesNewPageHeaderActions: () => <div data-testid="architectures-new-page-header-actions" />,
}));

import NewArchitecturePage from "./page";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { ARCHITECTURES_NEW_CLAIM_DISCIPLINE } from "@/lib/architectures-new-evidence-copy";
import {
  ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER,
} from "@/lib/architectures-new-page-copy";

describe("NewArchitecturePage buyer-polished shell", () => {
  it("renders buyer subtitle with drafting scope and sources-only orientation strip", () => {
    render(<NewArchitecturePage />);

    const pageSubtitle = screen.getByTestId("architecture-new-page-subtitle");
    expect(screen.getByTestId("architecture-new-page-title")).toHaveTextContent(CREATE_ARCHITECTURE_LABEL);
    expect(pageSubtitle).toHaveTextContent(ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER);
    expect(pageSubtitle).toHaveTextContent(ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE);
    expect(screen.getByTestId("architectures-new-orientation-top")).toBeInTheDocument();
    expect(screen.queryByText(ARCHITECTURES_NEW_CLAIM_DISCIPLINE)).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-workspace")).toBeInTheDocument();
  });
});
