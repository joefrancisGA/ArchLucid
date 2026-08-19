import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExternalLink } from "@/components/ui/external-link";

describe("ExternalLink", () => {
  it("opens in a new tab with noopener noreferrer", () => {
    render(
      <ExternalLink href="https://example.com/docs">
        Read docs
      </ExternalLink>,
    );

    const link = screen.getByRole("link", { name: "Read docs" });

    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
