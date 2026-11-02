import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowScenarioWalksPageView } from "./SecureNowScenarioWalksPageView";

describe("SecureNow scenario walks page", () => {
  it("renders the five fixture walks with honest labels", () => {
    const { container } = render(<SecureNowScenarioWalksPageView />);

    expect(screen.getByTestId("securenow-scenario-walks-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fixture walks" })).toBeInTheDocument();
    expect(screen.getByText(/Not customer evidence/)).toBeInTheDocument();
    expect(screen.getByText(/NO_GO/)).toBeInTheDocument();

    for (const id of [
      "public-storage-path",
      "collection-gap",
      "advisory-cut-no-write",
      "later-capture-not-verified",
      "contributor-role-between-snapshots",
    ]) {
      expect(screen.getByText(id)).toBeInTheDocument();
    }

    expect(container).not.toHaveTextContent(/\$/);
  });
});
