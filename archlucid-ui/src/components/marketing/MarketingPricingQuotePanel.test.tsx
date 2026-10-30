import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarketingPricingQuotePanel } from "./MarketingPricingQuotePanel";

describe("MarketingPricingQuotePanel", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("System.InvalidOperationException: database unavailable", { status: 500 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not expose upstream failure details in the customer-facing error", async () => {
    render(<MarketingPricingQuotePanel openOnMount />);

    fireEvent.change(screen.getByRole("textbox", { name: "Work email" }), {
      target: { value: "buyer@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Company" }), {
      target: { value: "Contoso" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Please send pricing." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit quote request" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("We couldn't submit your request. Please try again.");
    });
    expect(screen.getByRole("alert")).not.toHaveTextContent("System.InvalidOperationException");
  });

  it("does not submit when required buyer identity fields are empty", () => {
    render(<MarketingPricingQuotePanel openOnMount />);

    fireEvent.click(screen.getByRole("button", { name: "Submit quote request" }));

    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not submit when the work email is malformed", () => {
    render(<MarketingPricingQuotePanel openOnMount />);

    fireEvent.change(screen.getByRole("textbox", { name: "Work email" }), {
      target: { value: "buyer-at-example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Company" }), {
      target: { value: "Contoso" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit quote request" }));

    expect(fetch).not.toHaveBeenCalled();
  });
});
