import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

describe("OperatorPageBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(
      <OperatorPageBreadcrumb
        items={[
          { label: "Approval", href: "/governance/approval-queue" },
          { label: "Alert rules" },
        ]}
        data-testid="sample-breadcrumb"
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
  });
});
