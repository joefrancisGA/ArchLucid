import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const evalChromeMock = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
}));

vi.mock("./ArchitecturesHubClaimOrientationStrip", () => ({
  ArchitecturesHubClaimOrientationStrip: () => (
    <div data-testid="architectures-hub-claim-orientation-strip">Guided teaching chrome</div>
  ),
}));

import { ArchitecturesHubBuyerChrome } from "./ArchitecturesHubBuyerChrome";

describe("ArchitecturesHubBuyerChrome eval leakage guard (CA-47)", () => {
  beforeEach(() => {
    evalChromeMock.enabled = false;
  });

  it("hides the hub Sources follow-ups strip on Working architectures", () => {
    render(<ArchitecturesHubBuyerChrome />);

    expect(screen.queryByTestId("architectures-hub-claim-orientation-strip")).not.toBeInTheDocument();
  });

  it("allows the hub Sources follow-ups strip in Guided eval chrome", () => {
    evalChromeMock.enabled = true;

    render(<ArchitecturesHubBuyerChrome />);

    expect(screen.getByTestId("architectures-hub-claim-orientation-strip")).toBeInTheDocument();
  });
});
