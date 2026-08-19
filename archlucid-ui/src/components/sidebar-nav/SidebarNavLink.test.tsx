import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarNavLink } from "@/components/sidebar-nav/SidebarNavLink";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import type { NavLinkItem } from "@/lib/nav-config.types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  } & Record<string, unknown>) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

const newReviewLink: NavLinkItem = {
  href: "/architecture/reviews/new",
  label: CREATE_ARCHITECTURE_LABEL,
  title: "Start a review",
  tier: "essential",
};

describe("SidebarNavLink", () => {
  it("uses active nav styling for New review when active in buyer-polished shell", () => {
    render(
      <SidebarNavLink
        presented={newReviewLink}
        active
        advancedDemo={false}
        buyerPolishedShell
      />,
    );

    const link = screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL });

    expect(link).toHaveAttribute("aria-current", "page");
    expect(link.className).toContain(DESIGN_TOKENS.interactive.navActive);
    expect(link.className).not.toContain("text-neutral-600");
  });

  it("does not apply muted disabled-looking styles when New review is inactive", () => {
    render(
      <SidebarNavLink
        presented={newReviewLink}
        active={false}
        advancedDemo={false}
        buyerPolishedShell
      />,
    );

    const link = screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL });

    expect(link).not.toHaveAttribute("aria-current");
    expect(link.className).toContain("text-neutral-900");
    expect(link.className).not.toContain("text-neutral-600");
  });

  it("exposes supplemental nav hint via aria-describedby instead of title", () => {
    render(
      <SidebarNavLink
        presented={newReviewLink}
        active={false}
        advancedDemo={false}
        buyerPolishedShell
      />,
    );

    const link = screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL });

    expect(link).not.toHaveAttribute("title");
    expect(link).toHaveAttribute("aria-describedby", "sidebar-nav-link-hint--architecture-reviews-new");
    expect(document.getElementById("sidebar-nav-link-hint--architecture-reviews-new")).toHaveTextContent(
      "Start a review",
    );
  });
});
