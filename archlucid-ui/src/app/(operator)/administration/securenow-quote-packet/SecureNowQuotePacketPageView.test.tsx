import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowQuotePacketPageView } from "./SecureNowQuotePacketPageView";

describe("SecureNowQuotePacketPageView", () => {
  it("renders a bounded quote packet with published list prices", () => {
    render(<SecureNowQuotePacketPageView />);

    expect(screen.getByTestId("securenow-quote-packet-page")).toBeInTheDocument();
    expect(screen.getByText(/accepts SN-EVAL orders/)).toBeInTheDocument();
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

    expect(screen.getByTestId("securenow-published-list-price")).toBeInTheDocument();
    expect(screen.getByText(/\$24,000/)).toBeInTheDocument();
    expect(screen.getByTestId("securenow-beta-sku-contents-section")).toBeInTheDocument();
  });
});
