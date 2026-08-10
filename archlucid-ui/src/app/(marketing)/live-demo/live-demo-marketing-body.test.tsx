import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getShowcaseStaticDemoPayload, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { LIVE_DEMO_PAGE_TITLE } from "@/lib/live-demo-page-copy";
import { normalizeSeeItMarketingPayload } from "../see-it/normalize-see-it-payload";

import { LiveDemoMarketingBody } from "./LiveDemoMarketingBody";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => "/live-demo",
}));

vi.mock("@/lib/live-demo-telemetry", () => ({
  trackLiveDemoWalkthroughStarted: vi.fn(),
  trackLiveDemoStepViewed: vi.fn(),
  trackLiveDemoArtifactOpened: vi.fn(),
  trackLiveDemoConversionClick: vi.fn(),
}));

const payload = normalizeSeeItMarketingPayload(getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID));

describe("LiveDemoMarketingBody", () => {
  it("renders guided walkthrough with executive step and conversion CTA", () => {
    render(<LiveDemoMarketingBody payload={payload} activeStepId="executive" />);

    expect(screen.getByTestId("live-demo-walkthrough-shell")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-step-executive")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-stepper-executive")).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("live-demo-conversion-cta")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-cta-evaluation")).toBeInTheDocument();
    expect(screen.queryByText("Technical details")).not.toBeInTheDocument();
  });

  it("exposes all five stepper controls", () => {
    render(<LiveDemoMarketingBody payload={payload} activeStepId="executive" />);

    expect(screen.getByTestId("live-demo-stepper-executive")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-stepper-signed-record")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-stepper-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-stepper-governance")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-stepper-audit-trail")).toBeInTheDocument();
  });
});

describe("live-demo page identity", () => {
  it("uses honest sample-walkthrough title constant (TB-1265)", () => {
    expect(LIVE_DEMO_PAGE_TITLE).toBe("Guided sample walkthrough");
    expect(LIVE_DEMO_PAGE_TITLE.toLowerCase()).not.toMatch(/^live demo$/);
  });
});
