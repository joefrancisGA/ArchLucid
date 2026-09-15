import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const productLineMock = vi.hoisted(() => ({ value: "architecture" as "architecture" | "security" }));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLineMock.value }),
}));

import { DemoVsLiveChromeBanner } from "@/components/usability/DemoVsLiveChromeBanner";

describe("DemoVsLiveChromeBanner (TB-2218)", () => {
  beforeEach(() => {
    productLineMock.value = "architecture";
  });

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
    expect(screen.getByTestId("demo-vs-live-chrome-banner")).toHaveTextContent("RULE-BASED");
  });

  it("renders nothing in the SecureNow shell", () => {
    productLineMock.value = "security";

    const { container } = render(<DemoVsLiveChromeBanner isStaticDemoEnv showWatermark />);

    expect(container).toBeEmptyDOMElement();
  });
});