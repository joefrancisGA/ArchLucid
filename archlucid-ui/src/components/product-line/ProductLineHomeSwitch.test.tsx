import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductLineHomeSwitch } from "@/components/product-line/ProductLineHomeSwitch";
import {
  ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE,
} from "@/lib/product-line/product-line-copy";

const productLineMock = vi.hoisted(() => ({ value: "architecture" as "architecture" | "security" }));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: productLineMock.value,
    assignmentOverrides: {},
    setProductLine: () => {},
    setHrefAssignment: () => {},
    resetHrefAssignment: () => {},
    resetAllAssignments: () => {},
  }),
}));

vi.mock("@/components/product-line/SecurityProductHome", () => ({
  SecurityProductHome: () => <div data-testid="security-product-home-stub">security home</div>,
}));

vi.mock("@/components/product-line/ProductLineSwitchBar", () => ({
  ProductLineSwitchBar: () => <div data-testid="product-line-switch-bar-stub" />,
}));

describe("ProductLineHomeSwitch", () => {
  it("renders the architecture home slot when the shell is Architecture", () => {
    productLineMock.value = "architecture";

    render(
      <ProductLineHomeSwitch architectureHome={<p data-testid="architecture-home-stub">architecture home</p>} />,
    );

    expect(screen.getByTestId("architecture-home-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("security-product-home-stub")).not.toBeInTheDocument();
  });

  it("renders the Security home when the shell is Security", () => {
    productLineMock.value = "security";

    render(
      <ProductLineHomeSwitch architectureHome={<p data-testid="architecture-home-stub">architecture home</p>} />,
    );

    expect(screen.getByTestId("security-product-home-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-home-stub")).not.toBeInTheDocument();
  });

  it("shows the dual-start hint when Architecture is selected without an architecture home slot", () => {
    productLineMock.value = "architecture";

    render(<ProductLineHomeSwitch />);

    expect(screen.getByTestId("architecture-home-security-env-hint")).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-home-stub")).not.toBeInTheDocument();
  });
});
