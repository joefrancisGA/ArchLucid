import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductLineHomeSwitch } from "@/components/product-line/ProductLineHomeSwitch";
import { INTERNAL_PRODUCT_LINE_PATH } from "@/lib/product-line/product-line-catalog";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE,
  PRODUCT_LINE_HOME_JOB_ARCHITECTURE_OPEN_LIST_LABEL,
  PRODUCT_LINE_HOME_JOB_ARCHITECTURE_TITLE,
  PRODUCT_LINE_HOME_JOB_SECURITY_OUTCOME,
  PRODUCT_LINE_HOME_JOB_SECURITY_TITLE,
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the architecture home slot when the shell is Architecture", () => {
    productLineMock.value = "architecture";

    render(
      <ProductLineHomeSwitch architectureHome={<p data-testid="architecture-home-stub">architecture home</p>} />,
    );

    expect(screen.getByTestId("architecture-home-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("infrastructure-overview-home-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("product-line-switch-bar")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PRODUCT_LINE_HOME_JOB_SECURITY_TITLE })).toBeInTheDocument();
    expect(screen.getByText(PRODUCT_LINE_HOME_JOB_SECURITY_OUTCOME)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_OPEN_LIST_LABEL })).toHaveAttribute(
      "href",
      ARCHITECTURES_LIST_PATH,
    );
    expect(screen.queryByRole("button", { name: "See what this Azure estate can reach" })).not.toBeInTheDocument();
  });

  it("renders the infrastructure overview home when the shell is Security", () => {
    productLineMock.value = "security";

    render(<ProductLineHomeSwitch />);

    expect(screen.getByTestId("infrastructure-overview-home-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-home-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("product-line-switch-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("product-line-home-job-chooser")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_TITLE })).not.toBeInTheDocument();
  });

  it("keeps the architecture review job available when this process hosts the architecture home", () => {
    productLineMock.value = "security";

    render(
      <ProductLineHomeSwitch architectureHome={<p data-testid="architecture-home-stub">architecture home</p>} />,
    );

    expect(screen.getByTestId("infrastructure-overview-home-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-home-stub")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_TITLE })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_OPEN_LIST_LABEL }),
    ).not.toBeInTheDocument();
  });

  it("hides the architecture job on the UHG edition", () => {
    productLineMock.value = "security";
    vi.stubEnv("NEXT_PUBLIC_SECURENOW_EDITION", "uhg");

    render(
      <ProductLineHomeSwitch architectureHome={<p data-testid="architecture-home-stub">architecture home</p>} />,
    );

    expect(screen.getByTestId("infrastructure-overview-home-stub")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_TITLE })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_TITLE })).not.toBeInTheDocument();
  });
});
