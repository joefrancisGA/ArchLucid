import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoVsLiveChromeBanner } from "@/components/usability/DemoVsLiveChromeBanner";

describe("DemoVsLiveChromeBanner (TB-2218)", () => {
  it("renders nothing for live mode", () => {
    const { container } = render(<DemoVsLiveChromeBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders aggressive static-demo chrome with watermark", () => {
    render(<DemoVsLiveChromeBanner usedStaticDemoRun showWatermark />);

    expect(screen.getByTestId("demo-vs-live-chrome-static-demo")).toBeInTheDocument();
    expect(screen.getByTestId("demo-vs-live-chrome-banner")).toHaveTextContent("NOT LIVE DATA");
    expect(screen.getByTestId("demo-vs-live-chrome-watermark")).toHaveTextContent("DEMO — NOT LIVE");
  });

  it("renders simulator chrome", () => {
    render(<DemoVsLiveChromeBanner isSimulator />);

    expect(screen.getByTestId("demo-vs-live-chrome-simulator")).toBeInTheDocument();
    expect(screen.getByTestId("demo-vs-live-chrome-banner")).toHaveTextContent("SIMULATOR");
  });
});