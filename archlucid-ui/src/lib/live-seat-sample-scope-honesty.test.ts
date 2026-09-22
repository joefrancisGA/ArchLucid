import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DemoVsLiveChromeBanner } from "@/components/usability/DemoVsLiveChromeBanner";
import { PUBLIC_DEMO_RECORD_MODE_CHROME_REMINDER } from "@/lib/governance/working-career-rehearsal-door-copy";

const UI_ROOT = join(process.cwd(), "src");

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ mode: "working", mounted: true }),
}));

vi.mock("@/hooks/use-working-career-rehearsal-door", () => ({
  useWorkingCareerRehearsalDoor: () => ({ door: "career", mounted: true }),
}));

describe("live-seat sample scope honesty (LS-013)", () => {
  it("keeps NOT LIVE DATA banner when Working Record is selected on static demo", () => {
    render(<DemoVsLiveChromeBanner usedStaticDemoRun={true} />);

    expect(screen.getByTestId("demo-vs-live-chrome-banner")).toHaveTextContent("NOT LIVE DATA");
    expect(screen.getByTestId("demo-vs-live-record-mode-reminder")).toHaveTextContent(
      PUBLIC_DEMO_RECORD_MODE_CHROME_REMINDER,
    );
  });

  it("does not gate demo honesty banners on review type in banner source", () => {
    const bannerSource = readFileSync(
      join(UI_ROOT, "components/usability/DemoVsLiveChromeBanner.tsx"),
      "utf8",
    );

    expect(bannerSource).not.toMatch(/door\s*===\s*"career"\s*\?\s*null/);
    expect(bannerSource).toContain("showRecordModeReminder");
  });

  it("record reminder copy does not claim sample data becomes live tenant data", () => {
    expect(PUBLIC_DEMO_RECORD_MODE_CHROME_REMINDER).toMatch(/sample data/i);
    expect(PUBLIC_DEMO_RECORD_MODE_CHROME_REMINDER).not.toMatch(/makes.*live/i);
  });
});
