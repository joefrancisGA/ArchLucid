import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FrictionlessTrialBanner } from "@/components/FrictionlessTrialBanner";

const trialSessionMock = vi.hoisted(() => ({
  enabled: true,
}));

vi.mock("@/lib/frictionless-trial-session", () => ({
  readFrictionlessTrialSessionEnabled: () => trialSessionMock.enabled,
}));

describe("FrictionlessTrialBanner", () => {
  afterEach(() => {
    trialSessionMock.enabled = true;
  });

  it("renders a single-line sticky strip without flex-wrap", () => {
    render(<FrictionlessTrialBanner />);

    const banner = screen.getByTestId("frictionless-trial-banner");
    const row = banner.firstElementChild;

    expect(banner).toHaveClass("px-4", "py-1");
    expect(row).not.toBeNull();
    expect(row?.className).toMatch(/\bflex-nowrap\b/);
    expect(row?.className).not.toMatch(/\bflex-wrap\b/);
    expect(screen.getByRole("link", { name: "Start an evaluation" })).toBeInTheDocument();
  });

  it("hides when the frictionless trial session is inactive", () => {
    trialSessionMock.enabled = false;

    const { container } = render(<FrictionlessTrialBanner />);

    expect(container).toBeEmptyDOMElement();
  });
});
