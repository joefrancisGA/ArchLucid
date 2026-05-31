import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeverityTag } from "@/components/ui/severity-tag";

describe("SeverityTag", () => {
  it("normalizes API severity strings", () => {
    render(<SeverityTag severity="High" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
