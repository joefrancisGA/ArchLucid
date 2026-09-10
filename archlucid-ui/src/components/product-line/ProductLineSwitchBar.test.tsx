import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductLineSwitchBar } from "@/components/product-line/ProductLineSwitchBar";

const productLineState = vi.hoisted(() => ({
  productLine: "architecture" as "architecture" | "security",
  setProductLine: vi.fn(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: productLineState.productLine,
    assignmentOverrides: {},
    setProductLine: productLineState.setProductLine,
    setHrefAssignment: () => {},
    resetHrefAssignment: () => {},
    resetAllAssignments: () => {},
  }),
}));

describe("ProductLineSwitchBar", () => {
  it("selects SecureNow without linking to individual destinations", () => {
    productLineState.productLine = "architecture";
    productLineState.setProductLine.mockClear();

    render(<ProductLineSwitchBar />);

    expect(screen.getByRole("group", { name: "Product shell" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Move individual destinations" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("product-line-option-security"));

    expect(productLineState.setProductLine).toHaveBeenCalledWith("security");
  });
});
