import { describe, expect, it } from "vitest";

import {
  demoVsLiveChromeCopy,
  demoVsLiveChromeForFlags,
  resolveDemoVsLiveChromeMode,
} from "@/lib/demo-vs-live-chrome";

describe("demo-vs-live-chrome (TB-2218)", () => {
  it("resolves live when no demo or simulator flags are set", () => {
    expect(resolveDemoVsLiveChromeMode({})).toBe("live");
    expect(demoVsLiveChromeForFlags({})).toBeNull();
    expect(demoVsLiveChromeCopy("live")).toBeNull();
  });

  it("labels static demo aggressively and prefers it over simulator", () => {
    const copy = demoVsLiveChromeForFlags({ usedStaticDemoRun: true, isSimulator: true });

    expect(resolveDemoVsLiveChromeMode({ usedStaticDemoRun: true })).toBe("static-demo");
    expect(resolveDemoVsLiveChromeMode({ isStaticDemoEnv: true })).toBe("static-demo");
    expect(copy?.mode).toBe("static-demo");
    expect(copy?.bannerTitle).toContain("NOT LIVE");
    expect(copy?.watermark).toContain("NOT LIVE");
  });

  it("labels simulator mode when not static demo", () => {
    const copy = demoVsLiveChromeForFlags({ isSimulator: true });

    expect(resolveDemoVsLiveChromeMode({ isSimulator: true })).toBe("simulator");
    expect(copy?.mode).toBe("simulator");
    expect(copy?.bannerTitle).toContain("SIMULATOR");
    expect(copy?.watermark).toContain("NOT LIVE");
  });
});