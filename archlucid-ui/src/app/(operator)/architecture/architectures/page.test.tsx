import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: false }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("./_sections/ArchitecturesHubListSection", () => ({
  ArchitecturesHubListSection: () => <div data-testid="architectures-hub-list-section" />,
}));

vi.mock("./_sections/ArchitecturesHubBuyerChrome", () => ({
  ArchitecturesHubBuyerChrome: () => null,
}));

import ArchitecturesListPage from "./page";
import { ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE } from "@/lib/architecture/architecture-identity-desk-copy";
import { ARCHITECTURES_HUB_PAGE_SUBTITLE, ARCHITECTURES_HUB_PAGE_TITLE } from "@/lib/architectures-hub-copy";

describe("ArchitecturesListPage", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = false;
  });

  it("renders mode-aware hub chrome and list section", () => {
    render(<ArchitecturesListPage />);

    expect(screen.getByTestId("architectures-hub-page-title")).toHaveTextContent(ARCHITECTURES_HUB_PAGE_TITLE);
    expect(screen.getByTestId("architectures-hub-list-section")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-object-map-strip")).toBeInTheDocument();
  });

  it("CA-48: Working hub subtitle teaches identity portfolio, not draft inventory", () => {
    workspaceModeMock.isWorkingMode = true;

    render(<ArchitecturesListPage />);

    expect(screen.getByTestId("architectures-hub-page-subtitle")).toHaveTextContent(
      ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE,
    );
    expect(screen.queryByText(ARCHITECTURES_HUB_PAGE_SUBTITLE)).not.toBeInTheDocument();
  });
});
