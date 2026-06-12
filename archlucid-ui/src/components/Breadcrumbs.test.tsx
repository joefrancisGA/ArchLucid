import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/evidence-trail",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders a single horizontal trail above page content", () => {
    render(<Breadcrumbs />);

    const trail = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = trail.querySelector("ol");

    expect(list).not.toBeNull();
    expect(list).toHaveClass("flex-nowrap");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByText("Evidence trail")).toHaveAttribute("aria-current", "page");
  });
});
