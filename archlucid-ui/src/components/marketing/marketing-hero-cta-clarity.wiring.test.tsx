import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("utm_source=src&utm_medium=med&utm_campaign=cmp"),
}));

import { MARKETING_ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/marketing-analytics-consent";

import { SelfDemoRequestCta } from "./SelfDemoRequestCta";
import { WalkthroughRequestCta } from "./WalkthroughRequestCta";

describe("marketing hero CTA → Clarity wiring", () => {
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

  it("clicking Request walkthrough fires cta_walkthrough_click with UTM dimensions from the page", () => {
    render(<WalkthroughRequestCta />);

    fireEvent.click(screen.getByRole("link", { name: /request walkthrough/i }));

    expect(clarity.mock.calls).toContainEqual(["set", "cta_source", "hero"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_source", "src"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_medium", "med"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_campaign", "cmp"]);
    expect(clarity.mock.calls).toContainEqual(["event", "cta_walkthrough_click"]);
  });

  it("clicking Try the self-demo fires cta_self_demo_click with UTM dimensions", () => {
    render(<SelfDemoRequestCta />);

    fireEvent.click(screen.getByRole("link", { name: /try the self-demo/i }));

    expect(clarity.mock.calls).toContainEqual(["set", "cta_source", "hero"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_source", "src"]);
    expect(clarity.mock.calls).toContainEqual(["event", "cta_self_demo_click"]);
  });
});
