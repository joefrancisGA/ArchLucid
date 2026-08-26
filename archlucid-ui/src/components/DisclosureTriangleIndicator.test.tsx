import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DisclosureTriangleIndicator } from "./DisclosureTriangleIndicator";

describe("DisclosureTriangleIndicator", () => {
  it("renders the native-style triangle glyph", () => {
    render(
      <details className="group" open>
        <summary>
          <DisclosureTriangleIndicator />
          Title
        </summary>
      </details>,
    );

    expect(screen.getByText("▸")).toHaveAttribute("aria-hidden", "true");
  });
});
