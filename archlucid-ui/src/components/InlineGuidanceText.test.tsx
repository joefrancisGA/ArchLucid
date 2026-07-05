import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { INLINE_GUIDANCE_LABEL_CLASS } from "@/lib/design-tokens";

describe("InlineGuidanceText", () => {
  it("emphasizes only the leading guidance label", () => {
    render(
      <InlineGuidanceText text="Optional setup: Finish workspace setup, reviewer access, and optional cloud connections." />,
    );

    const label = screen.getByText("Optional setup:");

    expect(label.tagName).toBe("STRONG");
    expect(label).toHaveClass(INLINE_GUIDANCE_LABEL_CLASS.split(" ")[0]);
    expect(
      screen.getByText(/Finish workspace setup, reviewer access, and optional cloud connections\./),
    ).toBeInTheDocument();
  });

  it("renders plain copy when no guidance label prefix is present", () => {
    render(<InlineGuidanceText text="Finish architecture reviews first." />);

    expect(screen.getByText("Finish architecture reviews first.")).toBeInTheDocument();
    expect(screen.queryByRole("strong")).not.toBeInTheDocument();
  });
});
