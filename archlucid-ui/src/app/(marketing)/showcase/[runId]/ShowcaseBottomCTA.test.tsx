import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShowcaseBottomCTA } from "./ShowcaseBottomCTA";

describe("ShowcaseBottomCTA", () => {
  it("renders one primary and one secondary conversion CTA", () => {
    render(<ShowcaseBottomCTA scenario="claims-intake-modernization" renderMode="static" />);

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Create your own request" })).toHaveAttribute("href", "/get-started");
    expect(screen.getByRole("link", { name: "Start guided evaluation" })).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("link", { name: "Sign in to workspace" })).not.toBeInTheDocument();
  });
});
