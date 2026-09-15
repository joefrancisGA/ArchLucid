import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const productLineMock = vi.hoisted(() => ({ value: "architecture" as "architecture" | "security" }));
const workspaceModeMock = vi.hoisted(() => ({
  mode: "working" as "guided" | "working",
  mounted: true,
}));
const doorMock = vi.hoisted(() => ({
  door: "rehearsal" as "career" | "rehearsal",
  mounted: true,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLineMock.value }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workspaceModeMock.mode,
    mounted: workspaceModeMock.mounted,
  }),
}));

vi.mock("@/hooks/use-working-career-rehearsal-door", () => ({
  useWorkingCareerRehearsalDoor: () => ({
    door: doorMock.door,
    mounted: doorMock.mounted,
    setDoor: vi.fn(),
  }),
}));

import { DemoVsLiveChromeBanner } from "@/components/usability/DemoVsLiveChromeBanner";

describe("DemoVsLiveChromeBanner (TB-2218)", () => {
  beforeEach(() => {
    productLineMock.value = "architecture";
    workspaceModeMock.mode = "working";
    workspaceModeMock.mounted = true;
    doorMock.door = "rehearsal";
    doorMock.mounted = true;
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

  it("adds a Record-mode reminder on demo chrome when Working Record is selected", () => {
    doorMock.door = "career";

    render(<DemoVsLiveChromeBanner isStaticDemoEnv showWatermark />);

    expect(screen.getByTestId("demo-vs-live-record-mode-reminder")).toHaveTextContent(/Record is for live tenant reviews/i);
  });
});