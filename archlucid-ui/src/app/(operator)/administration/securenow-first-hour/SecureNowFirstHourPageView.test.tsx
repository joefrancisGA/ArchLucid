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
    const productLinks = screen.getAllByRole("link", { name: "Open in product" });
    expect(productLinks).toHaveLength(3);
    expect(productLinks[0]).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
    expect(productLinks[1]).toHaveAttribute(
      "href",
      "/security/remediation-factory",
    );
    expect(productLinks[2]).toHaveAttribute("href", "/infrastructure/diagrams");
    expect(screen.getByRole("link", { name: "Open question queue" })).toHaveAttribute(
      "href",
      "/infrastructure/diagrams",
    );
    expect(document.getElementById("path-inspect")).toHaveTextContent("Path inspect");
    expect(screen.getByText(/Select a priority row/)).toBeInTheDocument();
    expect(document.getElementById("path-inspect")).toHaveTextContent("3 — Advisory cut point");
    expect(document.getElementById("stop")).toHaveTextContent("4 — Stop");
    expect(document.getElementById("first-useful-answer")).toBeInTheDocument();
  });
});
