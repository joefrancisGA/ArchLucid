import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingBreadcrumb } from "./PricingBreadcrumb";

describe("PricingBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<PricingBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
