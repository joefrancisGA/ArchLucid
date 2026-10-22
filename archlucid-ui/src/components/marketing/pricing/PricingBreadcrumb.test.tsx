import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PRICING_BREADCRUMB_HUB_LABEL,
  PRICING_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/marketing/pricing-page-copy";

import { PricingBreadcrumb } from "./PricingBreadcrumb";

describe("PricingBreadcrumb", () => {
  it("renders Welcome → Pricing trail", () => {
    render(<PricingBreadcrumb />);

    const breadcrumb = screen.getByTestId("pricing-breadcrumb");
    expect(breadcrumb).toHaveTextContent(PRICING_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(PRICING_BREADCRUMB_TOPIC_TITLE);
  });
});
