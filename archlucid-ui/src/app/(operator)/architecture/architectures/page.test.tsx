import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/architecture/ArchitectureDraftListClient", () => ({
  ArchitectureDraftListClient: () => <div data-testid="architecture-draft-list" />,
}));

vi.mock("@/components/architecture/ArchitectureDraftGuidanceDisclosure", () => ({
  ArchitectureDraftGuidanceDisclosure: () => null,
}));

vi.mock("./_sections/ArchitecturesHubHeaderActions", () => ({
  ArchitecturesHubHeaderActions: () => null,
}));

import ArchitecturesListPage from "./page";
import {
  ARCHITECTURES_HUB_PAGE_SUBTITLE,
  ARCHITECTURES_HUB_PAGE_TITLE,
} from "@/lib/architectures-hub-copy";

describe("ArchitecturesListPage", () => {
  it("renders a draft-inventory page title and honesty subtitle", () => {
    render(<ArchitecturesListPage />);

    expect(screen.getByTestId("architectures-hub-page-title")).toHaveTextContent(ARCHITECTURES_HUB_PAGE_TITLE);
    expect(screen.getByTestId("architectures-hub-page-title").textContent?.toLowerCase()).toContain("draft");
    expect(screen.getByText(ARCHITECTURES_HUB_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: ARCHITECTURES_HUB_PAGE_TITLE }),
    ).toBeInTheDocument();
  });
});
