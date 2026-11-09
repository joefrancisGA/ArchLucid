import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowReadoutPackPageView } from "./SecureNowReadoutPackPageView";

describe("SecureNowReadoutPackPageView", () => {
  it("renders fixture anchors and draft pattern links", () => {
    render(<SecureNowReadoutPackPageView />);

    expect(screen.getByTestId("securenow-readout-pack-page")).toBeInTheDocument();
    expect(screen.getAllByTestId("securenow-readout-pack-fixture-row").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Fixture ranked path (fixture-path-01)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Remediation pattern registry/i })).toHaveAttribute(
      "href",
      "/security/remediation-patterns",
    );
  });
});
