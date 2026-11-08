import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitecturesHubBreadcrumb } from "./ArchitecturesHubBreadcrumb";

describe("ArchitecturesHubBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<ArchitecturesHubBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
