import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductLineHomeSwitch } from "@/components/product-line/ProductLineHomeSwitch";
import { INTERNAL_PRODUCT_LINE_PATH } from "@/lib/product-line/product-line-catalog";
import {
  ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE,
  PRODUCT_LINE_OPEN_INTERNAL_LINK_LABEL,
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

vi.mock("@/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient", () => ({
  InfrastructureOverviewClient: () => <div data-testid="infrastructure-overview-home-stub">infrastructure overview</div>,
}));

describe("ProductLineHomeSwitch", () => {
  it("renders the architecture home slot when the shell is Architecture", () => {
    productLineMock.value = "architecture";

    render(
      <ProductLineHomeSwitch architectureHome={<p data-testid="architecture-home-stub">architecture home</p>} />,
    );

    expect(screen.getByTestId("architecture-home-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("infrastructure-overview-home-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("product-line-switch-bar")).not.toBeInTheDocument();
  });

  it("renders the infrastructure overview home when the shell is Security", () => {
    productLineMock.value = "security";

    render(
      <ProductLineHomeSwitch architectureHome={<p data-testid="architecture-home-stub">architecture home</p>} />,
    );

    expect(screen.getByTestId("infrastructure-overview-home-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-home-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("product-line-switch-bar")).not.toBeInTheDocument();
  });

  it("shows the dual-start hint with an Internal product-line link", () => {
    productLineMock.value = "architecture";

    render(<ProductLineHomeSwitch />);

    expect(screen.getByTestId("architecture-home-security-env-hint")).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: PRODUCT_LINE_OPEN_INTERNAL_LINK_LABEL })).toHaveAttribute(
      "href",
      INTERNAL_PRODUCT_LINE_PATH,
    );
    expect(screen.queryByTestId("product-line-switch-bar")).not.toBeInTheDocument();
  });
});
