import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowReviewerPacketPageView } from "./SecureNowReviewerPacketPageView";

describe("SecureNowReviewerPacketPageView", () => {
  it("renders procurement index, SKUs, and NO_GO guardrail", () => {
    render(<SecureNowReviewerPacketPageView />);

    expect(screen.getByTestId("securenow-reviewer-packet-page")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-reviewer-packet-page")).toHaveTextContent(/NO_GO/i);
    expect(screen.getByRole("link", { name: "Quote packet (SKU identifiers)" })).toHaveAttribute(
      "href",
      "/administration/securenow-quote-packet",
    );
    expect(screen.getByText(/cannot authorize commerce/i)).toBeInTheDocument();
  });
});
