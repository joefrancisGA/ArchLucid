import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowAcceleratorIndexPageView } from "./SecureNowAcceleratorIndexPageView";

describe("SecureNowAcceleratorIndexPageView", () => {
  it("lists the pilot spine row as start here", () => {
    render(<SecureNowAcceleratorIndexPageView />);

    expect(screen.getByTestId("securenow-accelerator-index-page")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-accelerator-index-link-/administration/securenow-pilot-spine")).toHaveAttribute(
      "href",
      "/administration/securenow-pilot-spine",
    );
    expect(screen.getByTestId("securenow-accelerator-index-link-/infrastructure/manual-upload")).toHaveAttribute(
      "href",
      "/infrastructure/manual-upload",
    );
  });
});
