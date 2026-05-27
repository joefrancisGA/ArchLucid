import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpProductGuide } from "./HelpProductGuide";

describe("HelpProductGuide", () => {
  it("surfaces the golden path and key deep links", () => {
    render(<HelpProductGuide />);

    expect(screen.getByRole("heading", { name: "Using ArchLucid" })).toBeInTheDocument();
    expect(screen.getByText("Golden path (first walkthrough)")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Open executive summary" })).toBeInTheDocument();

    const reviewPackageTargets = screen
      .getAllByRole("link", { name: "review packages" })
      .map((anchor) => anchor.getAttribute("href"));
    expect(reviewPackageTargets).toContain("/reviews?projectId=default");

    expect(screen.getByRole("link", { name: "Ask" })).toHaveAttribute("href", "/ask");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/signin");
  });
});
