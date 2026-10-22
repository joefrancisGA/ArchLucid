import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PRICING_PRIMARY_CONTENT_ID,
  PRICING_SKIP_LINK_LABEL,
} from "@/lib/marketing/pricing-page-copy";

import { PricingPageChrome } from "./PricingPageChrome";

describe("PricingPageChrome", () => {
  it("renders skip link, orientation above primary content, and wraps children", () => {
    render(
      <PricingPageChrome>
        <div data-testid="pricing-body-stub">Tier grid stub</div>
      </PricingPageChrome>,
    );

    expect(screen.getByRole("link", { name: PRICING_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PRICING_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("pricing-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("pricing-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("pricing-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("pricing-claim-discipline")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("pricing-primary-content");
    const orientation = screen.getByTestId("pricing-orientation-top");
    const body = screen.getByTestId("pricing-body-stub");

    expect(primaryContent).toContainElement(body);
    expect(orientation.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });
});
