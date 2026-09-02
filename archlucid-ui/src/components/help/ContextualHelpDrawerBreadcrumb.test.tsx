import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContextualHelpDrawerBreadcrumb } from "./ContextualHelpDrawerBreadcrumb";

describe("ContextualHelpDrawerBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<ContextualHelpDrawerBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("contextual-help-drawer-breadcrumb")).toBeNull();
  });
});
