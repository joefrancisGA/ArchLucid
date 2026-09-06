import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
import { ARCHITECTURES_HUB_PAGE_TITLE } from "@/lib/architectures-hub-copy";

describe("ArchitecturesListPage", () => {
  it("renders mode-aware hub chrome and list section", () => {
    render(<ArchitecturesListPage />);

    expect(screen.getByTestId("architectures-hub-page-title")).toHaveTextContent(ARCHITECTURES_HUB_PAGE_TITLE);
    expect(screen.getByTestId("architectures-hub-list-section")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-object-map-strip")).toBeInTheDocument();
  });
});
