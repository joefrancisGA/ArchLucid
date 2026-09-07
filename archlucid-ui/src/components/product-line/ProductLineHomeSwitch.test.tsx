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

vi.mock("@/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient", () => ({
  InfrastructureOverviewClient: () => <div data-testid="infrastructure-overview-home-stub">infrastructure overview</div>,
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
    expect(screen.queryByTestId("infrastructure-overview-home-stub")).not.toBeInTheDocument();
  });

  it("renders the infrastructure overview home when the shell is Security", () => {
    productLineMock.value = "security";

    render(
      <ProductLineHomeSwitch architectureHome={<p data-testid="architecture-home-stub">architecture home</p>} />,
    );

    expect(screen.getByTestId("infrastructure-overview-home-stub")).toBeInTheDocument();
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
