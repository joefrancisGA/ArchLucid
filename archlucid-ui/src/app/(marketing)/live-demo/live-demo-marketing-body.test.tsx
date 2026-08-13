import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getShowcaseStaticDemoPayload, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  LIVE_DEMO_PAGE_TITLE,
  LIVE_DEMO_START_WALKTHROUGH_CTA,
} from "@/lib/live-demo-page-copy";
import {
  LIVE_DEMO_SEE_IT_LADDER_SEE_IT_HREF,
  LIVE_DEMO_SEE_IT_LADDER_SEE_IT_LINK,
} from "@/lib/live-demo-see-it-ladder-copy";
import { normalizeSeeItMarketingPayload } from "../see-it/normalize-see-it-payload";

import { LiveDemoMarketingBody } from "./LiveDemoMarketingBody";
import { LiveDemoPageHeader } from "./LiveDemoPageHeader";

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

describe("LiveDemoPageHeader (TB-1266–TB-1267)", () => {
  it("keeps hero to title, one line, Start CTA, and see-it ladder link", () => {
    render(<LiveDemoPageHeader />);

    expect(screen.getByRole("heading", { level: 1, name: LIVE_DEMO_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-start-walkthrough")).toHaveAttribute(
      "href",
      "/live-demo?step=executive",
    );
    expect(screen.getByTestId("live-demo-start-walkthrough")).toHaveTextContent(LIVE_DEMO_START_WALKTHROUGH_CTA);
    expect(screen.getByTestId("live-demo-see-it-ladder-link")).toHaveAttribute("href", LIVE_DEMO_SEE_IT_LADDER_SEE_IT_HREF);
    expect(screen.getByTestId("live-demo-see-it-ladder-link")).toHaveTextContent(LIVE_DEMO_SEE_IT_LADDER_SEE_IT_LINK);
    expect(screen.queryByTestId("live-demo-fabricated-disclosure")).not.toBeInTheDocument();
  });
});

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

  it("exposes compact stepper controls with accessible step names (TB-1268)", () => {
    render(<LiveDemoMarketingBody payload={payload} activeStepId="executive" />);

    const executiveStep = screen.getByTestId("live-demo-stepper-executive");
    expect(executiveStep).toHaveAttribute("aria-label", "Step 1: Executive summary");
    expect(executiveStep).toHaveTextContent("Executive");
    expect(screen.getByTestId("live-demo-stepper-audit-trail")).toHaveAttribute("aria-label", "Step 5: Audit trail");
  });

  it("surfaces early evaluation CTA before the full conversion block (TB-1268)", () => {
    render(<LiveDemoMarketingBody payload={payload} activeStepId="executive" />);

    const early = screen.getByTestId("live-demo-early-conversion");
    const full = screen.getByTestId("live-demo-conversion-cta");

    expect(early.compareDocumentPosition(full) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("live-demo-early-cta-evaluation")).toBeInTheDocument();
  });

  it("moves sample status beside the stepper instead of a hero callout (TB-1266)", () => {
    render(<LiveDemoMarketingBody payload={payload} activeStepId="executive" />);

    expect(screen.getByTestId("live-demo-sample-status")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-sample-status").textContent?.toLowerCase()).toContain("fabricated");
  });

  it("continuous mode renders TOC plus one expanded panel (TB-1269)", () => {
    render(<LiveDemoMarketingBody payload={payload} activeStepId="executive" />);

    fireEvent.click(screen.getByTestId("live-demo-toggle-continuous"));

    expect(screen.getByTestId("live-demo-continuous-walkthrough")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-continuous-toc")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-continuous-panel-executive")).toBeInTheDocument();
    expect(screen.queryByTestId("live-demo-step-signed-record")).not.toBeInTheDocument();
    expect(screen.queryByTestId("live-demo-step-evidence")).not.toBeInTheDocument();
  });
});

describe("live-demo page identity", () => {
  it("uses honest sample-walkthrough title constant (TB-1265)", () => {
    expect(LIVE_DEMO_PAGE_TITLE).toBe("Guided sample walkthrough");
    expect(LIVE_DEMO_PAGE_TITLE.toLowerCase()).not.toMatch(/^live demo$/);
  });
});
