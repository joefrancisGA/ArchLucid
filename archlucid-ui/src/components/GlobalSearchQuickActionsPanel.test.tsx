import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GlobalSearchQuickActionsPanel } from "@/components/GlobalSearchQuickActionsPanel";

const productLineMock = vi.hoisted(() => ({ productLine: "architecture" as "architecture" | "security" }));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLineMock.productLine }),
}));

describe("GlobalSearchQuickActionsPanel", () => {
  it("labels evidence search Search review evidence in the Architecture shell", () => {
    productLineMock.productLine = "architecture";

    render(<GlobalSearchQuickActionsPanel inputId="search-input" onClose={vi.fn()} />);

    expect(screen.getByRole("link", { name: /Search review evidence/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Search evidence$/i })).not.toBeInTheDocument();
  });

  it("labels evidence search Search evidence in the SecureNow shell", () => {
    productLineMock.productLine = "security";

    render(<GlobalSearchQuickActionsPanel inputId="search-input" onClose={vi.fn()} />);

    expect(screen.getByRole("link", { name: /Search evidence/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Search review evidence/i })).not.toBeInTheDocument();
  });

  it("labels ask action Ask review questions in the Architecture shell", () => {
    productLineMock.productLine = "architecture";

    render(<GlobalSearchQuickActionsPanel inputId="search-input" onClose={vi.fn()} />);

    expect(screen.getByRole("link", { name: /Ask review questions/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ask questions/i })).not.toBeInTheDocument();
  });

  it("labels ask action Ask questions in the SecureNow shell", () => {
    productLineMock.productLine = "security";

    render(<GlobalSearchQuickActionsPanel inputId="search-input" onClose={vi.fn()} />);

    expect(screen.getByRole("link", { name: /Ask questions/i })).toBeInTheDocument();
    expect(screen.getByText("Scoped Q&A")).toBeInTheDocument();
    expect(screen.queryByText("Scoped Q&A over review evidence")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ask review questions/i })).not.toBeInTheDocument();
  });
});
