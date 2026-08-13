import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

describe("OperatorPageBreadcrumb", () => {
  it("renders linked parents and a plain-text current page", () => {
    render(
      <OperatorPageBreadcrumb
        items={[
          { label: "Governance", href: "/governance/approval-queue" },
          { label: "Alert rules" },
        ]}
        data-testid="sample-breadcrumb"
      />,
    );

    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Governance" })).toHaveAttribute(
      "href",
      "/governance/approval-queue",
    );
    expect(screen.getByText("Alert rules")).toHaveAttribute("aria-current", "page");
  });
});
