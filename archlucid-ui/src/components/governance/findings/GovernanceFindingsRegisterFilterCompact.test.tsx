import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsRegisterFilterCompact } from "./GovernanceFindingsRegisterFilterCompact";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams("q=payments"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: unknown;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("GovernanceFindingsRegisterFilterCompact", () => {
  it("renders All and Open filters with counts and clear action", () => {
    const onClearAllFilters = vi.fn();

    render(
      <GovernanceFindingsRegisterFilterCompact
        registerFilter="open"
        onClearAllFilters={onClearAllFilters}
        allCount={12}
        openCount={4}
      />,
    );

    expect(screen.getByRole("link", { name: "All (12)" })).toHaveAttribute(
      "href",
      "/governance/findings?q=payments",
    );
    expect(screen.getByRole("link", { name: "Open (4)" })).toHaveAttribute("aria-current", "true");
    const openHref = screen.getByRole("link", { name: "Open (4)" }).getAttribute("href");
    expect(openHref).toContain("filter=open");
    expect(openHref).toContain("q=payments");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearAllFilters).toHaveBeenCalled();
  });
});
