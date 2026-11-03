import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowScenarioWalksPageView } from "./SecureNowScenarioWalksPageView";

describe("SecureNowScenarioWalksPageView", () => {
  it("lists six scenarios and links fixture-path-02 to the public sample", () => {
    render(<SecureNowScenarioWalksPageView />);

    expect(screen.getByTestId("securenow-scenario-walks-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Six scenarios" })).toBeInTheDocument();
    expect(screen.getByText("fixture-path-02")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open fixture-path-02 on the public sample" })).toHaveAttribute(
      "href",
      "/securenow-sample#fixture-path-02",
    );
  });
});
