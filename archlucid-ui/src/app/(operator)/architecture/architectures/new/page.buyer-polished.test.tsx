import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  ARCHITECTURES_NEW_CLAIM_HEADING,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER,
} from "@/lib/architectures-new-page-copy";

describe("NewArchitecturePage buyer-polished shell", () => {
  it("renders buyer subtitle and claim orientation strip", () => {
    render(<NewArchitecturePage />);

    expect(screen.getByTestId("architecture-new-page-title")).toHaveTextContent(CREATE_ARCHITECTURE_LABEL);
    expect(screen.getByText(ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("architectures-new-orientation-top")).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURES_NEW_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURES_NEW_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-workspace")).toBeInTheDocument();
  });
});
