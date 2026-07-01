import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailPackageSubnav } from "./RunDetailPackageSubnav";

describe("RunDetailPackageSubnav", () => {
  it("links review package and executive summary routes", () => {
    render(<RunDetailPackageSubnav runId="run-abc" active="review-package" />);

    expect(screen.getByRole("link", { name: "Review package" })).toHaveAttribute("href", "/reviews/run-abc");
    expect(screen.getByRole("link", { name: "Executive summary" })).toHaveAttribute(
      "href",
      "/executive/reviews/run-abc",
    );
    expect(screen.getByRole("link", { name: "Review package" })).toHaveAttribute("aria-current", "page");
  });

  it("marks executive summary as current on that view", () => {
    render(<RunDetailPackageSubnav runId="run-abc" active="executive-summary" />);

    expect(screen.getByRole("link", { name: "Executive summary" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Review package" })).not.toHaveAttribute("aria-current");
  });
});
