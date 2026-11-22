import Link from "next/link";
import type { NextRouter } from "next/router";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PROCUREMENT_AL_EVAL_ANCHOR_FRAGMENT,
  PROCUREMENT_AL_EVAL_ANCHOR_TEST_ID,
} from "@/lib/procurement/procurement-evidence-map-anchors";

import { MarketingPricingQuotePanel } from "./MarketingPricingQuotePanel";

describe("MarketingPricingQuotePanel", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/pricing");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("System.InvalidOperationException: database unavailable", { status: 500 })),
    );
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
    vi.unstubAllGlobals();
  });

  it("opens an already-mounted panel when the public header link navigates in the current page", () => {
    const push = vi.fn(async (href: string) => {
      window.history.pushState(null, "", href);
      return true;
    });
    const router = { pathname: "/pricing", asPath: "/pricing", query: {}, push } as NextRouter;

    render(
      <RouterContext.Provider value={router}>
        <Link href="/pricing#pricing-quote-request" prefetch={false}>
          <span>Request demo</span>
        </Link>
        <MarketingPricingQuotePanel />
      </RouterContext.Provider>,
    );
    expect(screen.queryByRole("textbox", { name: "Work email" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Request demo"));

    expect(push).toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Work email" })).toBeInTheDocument();
  });

  it("opens an already-mounted panel when the browser navigates to the quote anchor", async () => {
    render(<MarketingPricingQuotePanel />);
    expect(screen.queryByRole("textbox", { name: "Work email" })).not.toBeInTheDocument();

    window.location.hash = "pricing-quote-request";

    expect(await screen.findByRole("textbox", { name: "Work email" })).toBeInTheDocument();
  });

  it("leaves the current panel closed when the quote link is opened in another tab", () => {
    render(
      <>
        <a href="/pricing#pricing-quote-request" onClick={(event) => event.preventDefault()}>
          Request demo
        </a>
        <MarketingPricingQuotePanel />
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Request demo" }), { ctrlKey: true });
    fireEvent.click(screen.getByRole("link", { name: "Request demo" }), { button: 1 });

    expect(screen.queryByRole("textbox", { name: "Work email" })).not.toBeInTheDocument();
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

  it("exposes the procurement AL-EVAL acceptance anchor on the quote form", () => {
    render(<MarketingPricingQuotePanel openOnMount />);

    const anchor = screen.getByTestId(PROCUREMENT_AL_EVAL_ANCHOR_TEST_ID);

    expect(anchor).toHaveAttribute("id", PROCUREMENT_AL_EVAL_ANCHOR_FRAGMENT);
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
