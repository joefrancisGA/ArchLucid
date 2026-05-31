import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InlineInfoTooltip } from "@/components/InlineInfoTooltip";

describe("InlineInfoTooltip", () => {
  it("uses an About label accessible name and shows hint text", () => {
    render(<InlineInfoTooltip label="Review authority" hint="Who can finalize packages in this tenant." />);

    expect(screen.getByRole("button", { name: "About Review authority" })).toBeInTheDocument();
  });
});
