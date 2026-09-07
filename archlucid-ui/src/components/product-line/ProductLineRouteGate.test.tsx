import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews" }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => pathnameMock.value,
    useRouter: () => ({ replace }),
  };
});

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

import { ProductLineRouteGate } from "@/components/product-line/ProductLineRouteGate";

describe("ProductLineRouteGate", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("blocks Architecture destinations in the Security product and returns to home", async () => {
    pathnameMock.value = "/architecture/reviews";

    render(
      <ProductLineRouteGate>
        <p>secret reviews</p>
      </ProductLineRouteGate>,
    );

    expect(screen.queryByText("secret reviews")).not.toBeInTheDocument();
    expect(screen.getByTestId("product-line-route-gate")).toHaveTextContent("SecureNow product");
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
  });

  it("allows always-reachable help and account paths in the Security product", () => {
    pathnameMock.value = "/help/getting-started";

    render(
      <ProductLineRouteGate>
        <p>help topic</p>
      </ProductLineRouteGate>,
    );

    expect(screen.getByText("help topic")).toBeInTheDocument();
    expect(screen.queryByTestId("product-line-route-gate")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("allows nested infrastructure resource hubs in the Security product", () => {
    pathnameMock.value = "/governance/infrastructure/resources/res-1";

    render(
      <ProductLineRouteGate>
        <p>resource hub</p>
      </ProductLineRouteGate>,
    );

    expect(screen.getByText("resource hub")).toBeInTheDocument();
    expect(screen.queryByTestId("product-line-route-gate")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
