import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MARKETING_LAYOUT } from "@/lib/design-tokens";

import { MarketingPageShell } from "./MarketingPageShell";

describe("MarketingPageShell", () => {
  it("renders the default marketing rail", () => {
    render(
      <MarketingPageShell>
        <h1>Overview</h1>
      </MarketingPageShell>,
    );

    const main = screen.getByRole("main");

    expect(main).toHaveAttribute("id", "main-content");
    expect(main.className).toContain(MARKETING_LAYOUT.main.split(" ")[0]);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
  });

  it("renders the reading-width variant", () => {
    render(
      <MarketingPageShell variant="reading">
        <p>FAQ body</p>
      </MarketingPageShell>,
    );

    expect(screen.getByRole("main").className).toContain("max-w-3xl");
    expect(screen.getByRole("main").className).toContain("mx-auto");
  });
});
