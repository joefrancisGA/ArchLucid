import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CtoDemoRecapCard } from "@/components/cto-demo/CtoDemoRecapCard";

const isCtoDemoPackEnvMock = vi.fn(() => true);

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoPackEnv: () => isCtoDemoPackEnvMock(),
}));

vi.mock("@/lib/api", () => ({
  downloadFirstValueReportPdf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("CtoDemoRecapCard", () => {
  beforeEach(() => {
    isCtoDemoPackEnvMock.mockReturnValue(true);
  });

  it("renders board packet button when demo pack env is active", () => {
    render(<CtoDemoRecapCard />);

    expect(screen.getByTestId("cto-demo-recap-board-packet")).toBeInTheDocument();
  });

  it("does not render board packet button when demo pack env is inactive", async () => {
    isCtoDemoPackEnvMock.mockReturnValue(false);

    render(<CtoDemoRecapCard />);

    expect(screen.queryByTestId("cto-demo-recap-board-packet")).toBeNull();
  });

  it("downloads board packet for showcase run when clicked", async () => {
    const { downloadFirstValueReportPdf } = await import("@/lib/api");

    render(<CtoDemoRecapCard />);

    fireEvent.click(screen.getByTestId("cto-demo-recap-board-packet"));

    await waitFor(() => {
      expect(downloadFirstValueReportPdf).toHaveBeenCalledWith("customer-intake-modernization");
    });
  });
});
