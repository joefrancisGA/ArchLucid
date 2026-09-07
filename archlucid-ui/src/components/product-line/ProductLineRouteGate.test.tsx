import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replace = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/architecture/reviews",
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
  it("blocks Architecture destinations in the Security product and returns to home", async () => {
    render(
      <ProductLineRouteGate>
        <p>secret reviews</p>
      </ProductLineRouteGate>,
    );

    expect(screen.queryByText("secret reviews")).not.toBeInTheDocument();
    expect(screen.getByTestId("product-line-route-gate")).toHaveTextContent("Security product");
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
  });
});
