import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeWorkingPrimaryCta } from "@/components/operator-home/OperatorHomeWorkingPrimaryCta";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => [],
}));

describe("OperatorHomeWorkingPrimaryCta (LI-06)", () => {
  it("opens the draft editor when no draft exists", () => {
    render(<OperatorHomeWorkingPrimaryCta />);

    const link = screen.getByTestId("operator-home-working-new-review-primary");

    expect(link).toHaveAttribute("href", ARCHITECTURES_NEW_PATH);
    expect(link).toHaveTextContent("Start review");
  });
});
