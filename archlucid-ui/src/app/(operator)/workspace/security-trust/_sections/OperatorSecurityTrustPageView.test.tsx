import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorSecurityTrustPageView } from "./OperatorSecurityTrustPageView";

describe("OperatorSecurityTrustPageView", () => {
  it("renders procurement-facing sections without GitHub blob links", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByText(/Security materials for procurement/i)).toBeInTheDocument();
    expect(screen.queryByText(/Review package and evidence trail/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Trust Center/i })).toHaveAttribute("href", "/trust");
    expect(screen.getByRole("link", { name: /Procurement contact/i })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:security@archlucid.net"),
    );
    expect(screen.getByText(/SOC 2 Type II readiness and audit engagement planning/i)).toBeInTheDocument();
    expect(screen.queryByText(/Formal SOC 2 Type II audit engagement/i)).not.toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/github\.com\/.*\/blob\//i);
  });

  it("collapses badge legend by default", () => {
    render(<OperatorSecurityTrustPageView />);

    const legend = screen.getByText("Badge legend");

    expect(legend.tagName).toBe("SUMMARY");
    expect(screen.getByText("Need security review support?")).toBeInTheDocument();
  });
});
