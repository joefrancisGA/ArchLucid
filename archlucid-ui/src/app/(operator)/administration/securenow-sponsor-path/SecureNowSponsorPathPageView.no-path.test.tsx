import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecureNowSponsorPathPageView } from "./SecureNowSponsorPathPageView";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/security/SecurityEvidencePathInspectPanel", () => ({
  SecurityEvidencePathInspectPanel: () => <div data-testid="sponsor-path-inspect-stub" />,
}));

describe("SecureNowSponsorPathPageView without pathId", () => {
  it("shows disposition rehearsal without a stored path", () => {
    render(<SecureNowSponsorPathPageView />);

    expect(screen.getByTestId("securenow-sponsor-path-no-path")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Path disposition outcome rehearsal"), {
      target: { value: "Proceed" },
    });

    expect(screen.getByTestId("securenow-sponsor-path-no-path-proceed-commercial")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-procurement-trust-strip")).toBeInTheDocument();
  });
});
