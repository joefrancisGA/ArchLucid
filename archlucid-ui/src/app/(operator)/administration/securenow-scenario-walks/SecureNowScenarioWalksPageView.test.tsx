import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowScenarioWalksPageView } from "./SecureNowScenarioWalksPageView";

describe("SecureNowScenarioWalksPageView", () => {
  it("lists seven scenarios and links fixture paths to the public sample", () => {
    render(<SecureNowScenarioWalksPageView />);

    expect(screen.getByTestId("securenow-scenario-walks-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seven scenarios" })).toBeInTheDocument();
    expect(screen.getByText("fixture-path-02")).toBeInTheDocument();
    expect(screen.getByText("fixture-path-03")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open fixture-path-02 on the public sample" })).toHaveAttribute(
      "href",
      "/securenow-sample#fixture-path-02",
    );
    expect(screen.getByRole("link", { name: "Open fixture-path-03 on the public sample" })).toHaveAttribute(
      "href",
      "/securenow-sample#fixture-path-03",
    );
  });
});
