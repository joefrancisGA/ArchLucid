import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecureNowPilotWalkthroughBanner } from "./SecureNowPilotWalkthroughBanner";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

describe("SecureNowPilotWalkthroughBanner", () => {
  it("renders beat context for security when walk beat is present", async () => {
    const { useSearchParams } = await import("next/navigation");
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("securenowWalkBeat=2"));

    render(<SecureNowPilotWalkthroughBanner productLine="security" />);

    expect(screen.getByTestId("securenow-pilot-walkthrough-banner")).toHaveTextContent(
      /Beat 2\/6 — One ranked path/i,
    );
    expect(screen.getByRole("link", { name: /Back to pilot checklist/i })).toHaveAttribute(
      "href",
      "/administration/securenow-pilot-spine#beat-ranked-path",
    );
  });

  it("omits the banner for architecture product line", async () => {
    const { useSearchParams } = await import("next/navigation");
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("securenowWalkBeat=1"));

    render(<SecureNowPilotWalkthroughBanner productLine="architecture" />);

    expect(screen.queryByTestId("securenow-pilot-walkthrough-banner")).toBeNull();
  });
});
