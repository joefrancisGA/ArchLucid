import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowPilotSpinePageView } from "./SecureNowPilotSpinePageView";

describe("SecureNowPilotSpinePageView", () => {
  it("renders six beats with product handoff links", () => {
    render(<SecureNowPilotSpinePageView />);

    expect(screen.getByTestId("securenow-pilot-spine-page")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open in product" })).toHaveLength(6);
    expect(screen.getByTestId("securenow-pilot-spine-beat-link-1")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections?securenowWalkBeat=1",
    );
    expect(screen.getByText(/does not authorize commerce/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /public sample beats/i })).toHaveAttribute(
      "href",
      "/securenow-sample",
    );
  });
});
