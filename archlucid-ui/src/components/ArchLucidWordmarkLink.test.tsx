import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { ARCHLUCID_BRAND } from "@/components/brand/brand-colors";
import { PERSONA_SHELL_WORDMARK_ARIA_LABEL } from "@/lib/persona-shell-vocabulary";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children?: React.ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("ArchLucidWordmarkLink", () => {
  it("renders compact ArchLucidLogo geometry for operator chrome by default", () => {
    const { container } = render(
      <ArchLucidWordmarkLink href="/" aria-label={PERSONA_SHELL_WORDMARK_ARIA_LABEL} variant="operator" />,
    );

    const link = screen.getByTestId("archlucid-wordmark-link");
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveAttribute("aria-label", PERSONA_SHELL_WORDMARK_ARIA_LABEL);
    expect(link).toHaveClass("h-8");

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector("path")).toHaveAttribute("fill", ARCHLUCID_BRAND.navy);
    expect(screen.getAllByText("ArchLucid").length).toBeGreaterThanOrEqual(1);
  });

  it("renders full ArchLucidLogo for marketing chrome by default", () => {
    const { container } = render(
      <ArchLucidWordmarkLink href="/welcome" aria-label="ArchLucid — welcome" variant="marketing" />,
    );

    expect(screen.getByTestId("archlucid-wordmark-link")).toHaveClass("h-7");

    const lightLogoSvg = container.querySelector("svg:not(.hidden)");
    expect(lightLogoSvg).toHaveAttribute("width", "28");
    expect(container.querySelector("polygon")).toHaveAttribute("fill", ARCHLUCID_BRAND.tealOnLightSurface);
  });

  it("honors logoVariant override for centered auth branding", () => {
    const { container } = render(
      <ArchLucidWordmarkLink
        href="/"
        aria-label="ArchLucid"
        variant="operator"
        logoVariant="full"
      />,
    );

    const lightLogoSvg = container.querySelector(".dark\\:hidden svg");
    expect(lightLogoSvg).toHaveAttribute("width", "32");
  });

  it("renders a dark-surface logo pair for theme switching", () => {
    const { container } = render(
      <ArchLucidWordmarkLink href="/" aria-label="ArchLucid" variant="operator" />,
    );

    const darkLogo = container.querySelector(".hidden.dark\\:inline-flex");
    expect(darkLogo).not.toBeNull();
    expect(darkLogo?.querySelector("path")).toHaveAttribute("fill", "#FFFFFF");
  });
});
