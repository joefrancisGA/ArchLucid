import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowFirstHourPageView } from "./SecureNowFirstHourPageView";

describe("SecureNowFirstHourPageView", () => {
  it("renders the four steps and terms", () => {
    render(<SecureNowFirstHourPageView />);

    expect(screen.getByTestId("securenow-first-hour-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Four steps" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Terms in one place" })).toBeInTheDocument();
    expect(screen.getByText(/NOT VERIFIED/)).toBeInTheDocument();
    expect(screen.getByText(/does not change Azure/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Open in product" })[0]).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
    expect(screen.getAllByRole("link", { name: "Open in product" })[1]).toHaveAttribute(
      "href",
      "/security/remediation-factory",
    );
  });
});
