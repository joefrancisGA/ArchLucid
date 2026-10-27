import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";

describe("PolicyPackInfluenceHonestyChip (P-13)", () => {
  it("shows not-stored tag when unmapped count is omitted", () => {
    render(<PolicyPackInfluenceHonestyChip />);

    expect(screen.getByText("Unmapped finding count was not stored.")).toBeInTheDocument();
  });
});
