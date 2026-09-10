import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostAuthBootstrapBreadcrumb } from "./PostAuthBootstrapBreadcrumb";

describe("PostAuthBootstrapBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<PostAuthBootstrapBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
