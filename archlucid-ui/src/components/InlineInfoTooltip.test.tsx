import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InlineInfoTooltip } from "@/components/InlineInfoTooltip";

describe("InlineInfoTooltip", () => {
  it("uses a Help-prefixed accessible name", () => {
    render(<InlineInfoTooltip label="Review authority" hint="Who can finalize packages in this tenant." />);

    expect(screen.getByRole("button", { name: "Help: Review authority" })).toBeInTheDocument();
  });
});
