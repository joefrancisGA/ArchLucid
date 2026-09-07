import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductLinePlaygroundClient } from "@/components/product-line/ProductLinePlaygroundClient";
import { PRODUCT_LINE_PLAYGROUND_DUAL_START_NOTE } from "@/lib/product-line/product-line-copy";

const productLineState = vi.hoisted(() => ({
  productLine: "security" as "architecture" | "security",
  assignmentOverrides: {} as Readonly<Record<string, "architecture" | "security" | "both">>,
  setProductLine: vi.fn(),
  setHrefAssignment: vi.fn(),
  resetHrefAssignment: vi.fn(),
  resetAllAssignments: vi.fn(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => productLineState,
}));

vi.mock("@/lib/product-line/resolve-product-line-id", () => ({
  resolveProductLineIdFromEnv: () => "security",
}));

vi.mock("@/lib/product-line/product-line-storage", () => ({
  readProductLineCookie: () => "architecture" as const,
}));

vi.mock("@/lib/nav-config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/nav-config")>();

  return {
    ...actual,
    flattenNavLinks: () => [
      {
        href: "/governance/infrastructure",
        label: "Infrastructure",
        title: "Infrastructure hub",
        requiredAuthority: "ReadAuthority",
      },
    ],
  };
});

describe("ProductLinePlaygroundClient", () => {
  it("shows build env, cookie override, active shell, and dual-start guidance", () => {
    productLineState.productLine = "architecture";
    productLineState.assignmentOverrides = { "/governance/infrastructure": "security" };

    render(<ProductLinePlaygroundClient />);

    const summary = screen.getByTestId("product-line-playground-env-summary");

    expect(summary).toHaveTextContent("Build env (NEXT_PUBLIC_ARCHLUCID_PRODUCT): Security");
    expect(summary).toHaveTextContent("Cookie override: Architecture");
    expect(summary).toHaveTextContent("Active shell: Architecture");
    expect(summary).toHaveTextContent("Href overrides: 1 in localStorage");
    expect(summary).toHaveTextContent(PRODUCT_LINE_PLAYGROUND_DUAL_START_NOTE);
  });

  it("resets href assignments from the playground control", () => {
    productLineState.resetAllAssignments.mockClear();

    render(<ProductLinePlaygroundClient />);
    fireEvent.click(screen.getByRole("button", { name: "Reset href assignments" }));

    expect(productLineState.resetAllAssignments).toHaveBeenCalledTimes(1);
  });
});
