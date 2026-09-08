import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthCallbackBreadcrumb } from "./AuthCallbackBreadcrumb";

describe("AuthCallbackBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<AuthCallbackBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
