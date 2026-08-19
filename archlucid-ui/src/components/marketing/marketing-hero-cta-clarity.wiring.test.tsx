import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useSearchParams: () => new URLSearchParams("utm_source=src&utm_medium=med&utm_campaign=cmp"),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

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

  it("clicking the optional walkthrough CTA fires cta_walkthrough_click with UTM dimensions from the page", () => {
    render(<WalkthroughRequestCta />);

    fireEvent.click(screen.getByRole("link", { name: /request optional walkthrough/i }));

    expect(clarity.mock.calls).toContainEqual(["set", "cta_source", "hero"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_source", "src"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_medium", "med"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_campaign", "cmp"]);
    expect(clarity.mock.calls).toContainEqual(["event", "cta_walkthrough_click"]);
  });

  it("clicking the inspect-sample-review CTA fires cta_self_demo_click with UTM dimensions", () => {
    render(<SelfDemoRequestCta />);

    fireEvent.click(screen.getByRole("link", { name: /inspect a governed sample review/i }));

    expect(clarity.mock.calls).toContainEqual(["set", "cta_source", "hero"]);
    expect(clarity.mock.calls).toContainEqual(["set", "cta_utm_source", "src"]);
    expect(clarity.mock.calls).toContainEqual(["event", "cta_self_demo_click"]);
  });
});
