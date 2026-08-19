import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/components/architecture/ArchitectureDraftListClient", () => ({
  ArchitectureDraftListClient: () => <div data-testid="architecture-draft-list" />,
}));

vi.mock("./_sections/ArchitecturesHubHeaderActions", () => ({
  ArchitecturesHubHeaderActions: () => null,
}));

vi.mock("./_sections/ArchitecturesHubPageSubtitle", () => ({
  ArchitecturesHubPageSubtitle: () => <span data-testid="architectures-hub-page-subtitle-mock">subtitle</span>,
}));

import ArchitecturesListPage from "./page";
import { ARCHITECTURES_HUB_PAGE_TITLE } from "@/lib/architectures-hub-copy";

describe("ArchitecturesListPage", () => {
  it("renders a draft-inventory page title and honesty subtitle", () => {
    render(<ArchitecturesListPage />);

    expect(screen.getByTestId("architectures-hub-page-title")).toHaveTextContent(ARCHITECTURES_HUB_PAGE_TITLE);
    expect(screen.getByTestId("architectures-hub-page-title").textContent?.toLowerCase()).toContain("draft");
    expect(screen.getByTestId("architectures-hub-page-subtitle-mock")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: ARCHITECTURES_HUB_PAGE_TITLE }),
    ).toBeInTheDocument();
  });
});
