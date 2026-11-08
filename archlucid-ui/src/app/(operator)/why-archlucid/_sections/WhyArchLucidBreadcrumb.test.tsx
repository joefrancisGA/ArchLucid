import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhyArchLucidBreadcrumb } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidBreadcrumb";

describe("WhyArchLucidBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<WhyArchLucidBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
