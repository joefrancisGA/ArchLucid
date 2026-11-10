import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchLucidProcurementTrustStrip } from "./ArchLucidProcurementTrustStrip";

describe("ArchLucidProcurementTrustStrip", () => {
  it("links trust, assurance, and procurement evidence map", () => {
    render(<ArchLucidProcurementTrustStrip />);

    expect(screen.getByTestId("archlucid-procurement-trust-strip")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Trust Center" })).toHaveAttribute("href", "/trust");
    expect(screen.getByRole("link", { name: "Assurance status" })).toHaveAttribute("href", "/assurance-status");
    expect(screen.getByRole("link", { name: "Procurement evidence map" })).toHaveAttribute(
      "href",
      "/procurement#procurement-evidence-map",
    );
  });
});
