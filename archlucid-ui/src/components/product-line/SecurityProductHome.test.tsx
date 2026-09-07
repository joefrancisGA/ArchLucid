import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: "security",
    assignmentOverrides: {},
    setProductLine: () => {},
    setHrefAssignment: () => {},
    resetHrefAssignment: () => {},
    resetAllAssignments: () => {},
  }),
}));

import { SecurityProductHome } from "@/components/product-line/SecurityProductHome";
import { SECURITY_PRODUCT_HOME_TITLE } from "@/lib/product-line/product-line-copy";

describe("SecurityProductHome", () => {
  it("shows the home header and product-line switch without duplicating sidebar destinations", () => {
    render(<SecurityProductHome />);

    expect(screen.getByTestId("security-product-home")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SECURITY_PRODUCT_HOME_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("product-line-switch-bar")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Infrastructure overview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Remediation factory/i })).not.toBeInTheDocument();
  });
});
