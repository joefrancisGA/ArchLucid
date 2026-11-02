import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowQuotePacketPageView } from "./SecureNowQuotePacketPageView";

describe("SecureNowQuotePacketPageView", () => {
  it("renders a bounded, fee-free quote packet", () => {
    render(<SecureNowQuotePacketPageView />);

    expect(screen.getByTestId("securenow-quote-packet-page")).toBeInTheDocument();
    expect(screen.getByText(/Not an approved offer/)).toBeInTheDocument();
    expect(screen.getByText(/NO_GO/)).toBeInTheDocument();
    expect(screen.getByText("This page cannot authorize commerce.")).toBeInTheDocument();

    for (const sku of ["SN-EVAL", "SN-ANNUAL", "SN-SUB-ADD", "SN-SNAP-4"]) {
      expect(screen.getByText(sku)).toBeInTheDocument();
    }

    for (const label of [
      "SKU and meter card",
      "Quote-to-pilot checklist",
      "Quote cover",
      "Order form",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }

    expect(screen.getByTestId("securenow-quote-packet-page")).not.toHaveTextContent("$");
  });
});
