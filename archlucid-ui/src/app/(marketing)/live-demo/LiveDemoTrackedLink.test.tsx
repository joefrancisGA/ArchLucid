import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveDemoTrackedLink } from "./LiveDemoTrackedLink";

const telemetry = vi.hoisted(() => ({
  trackLiveDemoArtifactOpened: vi.fn(),
  trackLiveDemoConversionClick: vi.fn(),
}));

vi.mock("@/lib/live-demo-telemetry", () => ({
  trackLiveDemoArtifactOpened: telemetry.trackLiveDemoArtifactOpened,
  trackLiveDemoConversionClick: telemetry.trackLiveDemoConversionClick,
}));

describe("LiveDemoTrackedLink", () => {
  it("tracks artifact clicks on the client boundary", () => {
    telemetry.trackLiveDemoArtifactOpened.mockClear();
    telemetry.trackLiveDemoConversionClick.mockClear();

    render(
      <LiveDemoTrackedLink href="/architecture/reviews/demo" trackKind="artifact" trackValue="sponsor">
        Inspect
      </LiveDemoTrackedLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Inspect" }));

    expect(telemetry.trackLiveDemoArtifactOpened).toHaveBeenCalledWith("sponsor");
    expect(telemetry.trackLiveDemoConversionClick).not.toHaveBeenCalled();
  });

  it("tracks conversion clicks on the client boundary", () => {
    telemetry.trackLiveDemoArtifactOpened.mockClear();
    telemetry.trackLiveDemoConversionClick.mockClear();

    render(
      <LiveDemoTrackedLink href="/get-started" trackKind="conversion" trackValue="evaluation">
        Start evaluation
      </LiveDemoTrackedLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Start evaluation" }));

    expect(telemetry.trackLiveDemoConversionClick).toHaveBeenCalledWith("evaluation");
    expect(telemetry.trackLiveDemoArtifactOpened).not.toHaveBeenCalled();
  });
});
