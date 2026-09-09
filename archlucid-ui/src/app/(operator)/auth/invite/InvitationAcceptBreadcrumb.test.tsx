import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InvitationAcceptBreadcrumb } from "./InvitationAcceptBreadcrumb";

describe("InvitationAcceptBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<InvitationAcceptBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
