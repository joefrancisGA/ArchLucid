import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchLucidLogo } from "@/components/brand/ArchLucidLogo";
import { ArchLucidMark } from "@/components/brand/ArchLucidMark";
import { ARCHLUCID_BRAND } from "@/components/brand/brand-colors";

describe("ArchLucidMark", () => {
  it("renders the navy A, teal facet, and two-node evidence path", () => {
    const { container } = render(<ArchLucidMark />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("viewBox", "0 0 32 32");

    expect(container.querySelector("path")).toHaveAttribute(
      "fill",
      ARCHLUCID_BRAND.navy,
    );
    expect(container.querySelector("polygon")).toHaveAttribute(
      "fill",
      ARCHLUCID_BRAND.teal,
    );

    const nodes = container.querySelectorAll("circle");
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toHaveAttribute("fill", ARCHLUCID_BRAND.navy);
    expect(nodes[1]).toHaveAttribute("fill", ARCHLUCID_BRAND.teal);

    expect(container.querySelector("line")).not.toBeNull();
  });

  it("is decorative (aria-hidden) without a title", () => {
    const { container } = render(<ArchLucidMark />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
    expect(container.querySelector("title")).toBeNull();
  });

  it("exposes an accessible image when given a title", () => {
    render(<ArchLucidMark title="ArchLucid" />);

    const img = screen.getByRole("img", { name: "ArchLucid" });
    expect(img.tagName.toLowerCase()).toBe("svg");
  });

  it("honors size and color overrides", () => {
    const { container } = render(
      <ArchLucidMark size={48} navyColor="#FFFFFF" tealColor="#000000" />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "48");
    expect(svg).toHaveAttribute("height", "48");
    expect(container.querySelector("path")).toHaveAttribute("fill", "#FFFFFF");
    expect(container.querySelector("polygon")).toHaveAttribute(
      "fill",
      "#000000",
    );
  });
});

describe("ArchLucidLogo", () => {
  it("renders mark + HTML wordmark text for the full variant", () => {
    const { container } = render(<ArchLucidLogo variant="full" />);

    expect(screen.getByText("ArchLucid")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders only the mark for the mark variant", () => {
    render(<ArchLucidLogo variant="mark" title="ArchLucid home" />);

    expect(screen.getByRole("img", { name: "ArchLucid home" })).toBeInTheDocument();
    expect(screen.queryByText("ArchLucid")).toBeNull();
  });

  it("renders a smaller mark for the compact variant", () => {
    const { container } = render(<ArchLucidLogo variant="compact" />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
    expect(screen.getByText("ArchLucid")).toBeInTheDocument();
  });

  it("defaults to the full variant", () => {
    const { container } = render(<ArchLucidLogo />);

    expect(container.querySelector("svg")).toHaveAttribute("width", "32");
    expect(screen.getByText("ArchLucid")).toBeInTheDocument();
  });
});
