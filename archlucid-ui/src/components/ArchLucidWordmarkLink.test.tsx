import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { ARCHLUCID_BRAND } from "@/components/brand/brand-colors";
import { PRODUCT_LINE_WORDMARK_ARIA_LABEL } from "@/lib/product-line/product-line-copy";

const productLineMock = vi.hoisted(() => ({ value: "architecture" as "architecture" | "security" }));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: productLineMock.value,
    assignmentOverrides: {},
    setProductLine: vi.fn(),
    setHrefAssignment: vi.fn(),
    resetHrefAssignment: vi.fn(),
    resetAllAssignments: vi.fn(),
  }),
}));

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
      <ArchLucidWordmarkLink
        href="/"
        aria-label={PRODUCT_LINE_WORDMARK_ARIA_LABEL.architecture}
        variant="operator"
      />,
    );

    const link = screen.getByTestId("archlucid-wordmark-link");
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveAttribute("aria-label", PRODUCT_LINE_WORDMARK_ARIA_LABEL.architecture);
    expect(link).toHaveClass("h-8");

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector("path")).toHaveAttribute("fill", ARCHLUCID_BRAND.navy);
    expect(screen.getAllByText("ArchLucid").length).toBeGreaterThanOrEqual(1);
  });

  it("renders SecureNow in the Security operator shell", () => {
    productLineMock.value = "security";

    render(
      <ArchLucidWordmarkLink
        href="/"
        aria-label={PRODUCT_LINE_WORDMARK_ARIA_LABEL.security}
        variant="operator"
      />,
    );

    expect(screen.getAllByText("SecureNow").length).toBeGreaterThanOrEqual(1);
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

  it("carries its own focus-visible ring so it needs no Button wrapper (TB-1671)", () => {
    render(<ArchLucidWordmarkLink href="/" aria-label="ArchLucid" variant="operator" />);

    const link = screen.getByTestId("archlucid-wordmark-link");

    // The brand mark renders unframed, so the keyboard indicator must live on the anchor itself.
    expect(link.className).toContain("focus-visible:ring-2");
    expect(link.className).not.toMatch(/\bborder(?:\s|-neutral)/);
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
