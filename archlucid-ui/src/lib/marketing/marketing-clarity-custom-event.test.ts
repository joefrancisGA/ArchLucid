import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MARKETING_ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/marketing-analytics-consent";

import {
  recordMarketingCtaEarlyAccessSubmit,
  recordMarketingCtaSelfDemoClick,
  recordMarketingCtaWalkthroughClick,
} from "./marketing-clarity-custom-event";

describe("marketing-clarity-custom-event", () => {
  let clarity: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clarity = vi.fn();
    (window as Window & { clarity?: typeof clarity }).clarity = clarity;
    window.localStorage.setItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY, "granted");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.removeItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY);
    delete (window as Window & { clarity?: typeof clarity }).clarity;
  });

  it("recordMarketingCtaWalkthroughClick sets dimensions and emits cta_walkthrough_click", () => {
    recordMarketingCtaWalkthroughClick({
      source: "hero",
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "q2",
    });

    expect(clarity.mock.calls).toContainEqual(["set", "cta_source", "hero"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_source", "newsletter"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_medium", "email"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_campaign", "q2"]);
    expect(clarity.mock.calls).toContainEqual(["event", "cta_walkthrough_click"]);
  });

  it("recordMarketingCtaSelfDemoClick emits cta_self_demo_click with UTMs", () => {
    recordMarketingCtaSelfDemoClick({
      source: "hero",
      utm_source: "s",
      utm_medium: "m",
      utm_campaign: "cmp",
    });

    expect(clarity.mock.calls.some((c) => c[0] === "event" && c[1] === "cta_self_demo_click")).toBe(true);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_source", "s"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_medium", "m"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_campaign", "cmp"]);
  });

  it("recordMarketingCtaEarlyAccessSubmit emits cta_early_access_submit and cta_email_domain", () => {
    recordMarketingCtaEarlyAccessSubmit({
      source: "hero",
      utm_source: "x",
      email_domain: "buyer.example",
    });

    expect(clarity.mock.calls).toContainEqual(["set", "cta_email_domain", "buyer.example"]);
    expect(clarity.mock.calls).toContainEqual(["event", "cta_early_access_submit"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_source", "x"]);
  });

  it("skips blank UTM dimensions but still emits the event", () => {
    recordMarketingCtaWalkthroughClick({ source: "hero", utm_source: "", utm_medium: "" });

    expect(clarity.mock.calls).toContainEqual(["set", "cta_source", "hero"]);
    expect(clarity.mock.calls).toContainEqual(["event", "cta_walkthrough_click"]);
    expect(clarity.mock.calls.some((c) => c[1] === "cta_utm_source")).toBe(false);
  });

  it("is a no-op when marketing consent is not granted", () => {
    window.localStorage.removeItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY);

    recordMarketingCtaWalkthroughClick({ source: "hero" });

    expect(clarity).not.toHaveBeenCalled();
  });

  it("is a no-op when clarity is not a function", () => {
    (window as Window & { clarity?: unknown }).clarity = undefined;

    recordMarketingCtaWalkthroughClick({ source: "hero" });

    expect(clarity).not.toHaveBeenCalled();
  });
});
