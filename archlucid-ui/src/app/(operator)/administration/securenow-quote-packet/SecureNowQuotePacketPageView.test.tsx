import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowQuotePacketPageView } from "./SecureNowQuotePacketPageView";

describe("SecureNowQuotePacketPageView", () => {
  it("renders a bounded quote packet with published list prices", () => {
    render(<SecureNowQuotePacketPageView />);

    expect(screen.getByTestId("securenow-quote-packet-page")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-quote-packet-sn-eval")).toBeInTheDocument();
    expect(screen.getAllByText(/accepts SN-EVAL orders/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/NO_GO/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("This page cannot authorize commerce.")).toBeInTheDocument();

    for (const sku of ["SN-EVAL", "SN-ANNUAL", "SN-SUB-ADD", "SN-SNAP-4"]) {
      expect(screen.getAllByText(sku).length).toBeGreaterThanOrEqual(1);
    }

    for (const label of [
      "SKU and meter card",
      "Quote-to-pilot checklist",
      "Quote cover",
      "Order form",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }

    expect(screen.getByTestId("securenow-published-list-price")).toBeInTheDocument();
    expect(screen.getByText(/\$24,000/)).toBeInTheDocument();
    expect(screen.getByTestId("securenow-beta-sku-contents-section")).toBeInTheDocument();
  });
});
