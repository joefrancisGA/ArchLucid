import { describe, expect, it } from "vitest";

import {
  buildWalkthroughCtaHref,
  WALKTHROUGH_REQUEST_MAILTO_SUBJECT,
} from "./build-walkthrough-cta-href";

describe("buildWalkthroughCtaHref", () => {
  it("uses booking URL with attribution when booking env is set", () => {
    const params: URLSearchParams = new URLSearchParams();
    params.set("utm_medium", "cpc");

    const href: string = buildWalkthroughCtaHref(params, "https://localhost", {
      bookingUrl: "https://cal.example/walk",
      mailtoFallback: "x@y.com",
    });

    expect(href).toContain("https://cal.example/walk");
    expect(href).toContain("utm_medium=cpc");
  });

  it("falls back to mailto with subject when booking URL is empty", () => {
    const params: URLSearchParams = new URLSearchParams();

    const href: string = buildWalkthroughCtaHref(params, "https://localhost", {
      bookingUrl: "",
      mailtoFallback: "sales@example.com",
    });

    expect(href.startsWith("mailto:sales@example.com?subject=")).toBe(true);
    expect(decodeURIComponent(href.split("subject=")[1] ?? "")).toBe(WALKTHROUGH_REQUEST_MAILTO_SUBJECT);
  });

  it("uses bare mailto with subject when both booking and fallback email are empty", () => {
    const params: URLSearchParams = new URLSearchParams();

    const href: string = buildWalkthroughCtaHref(params, "https://localhost", {
      bookingUrl: "",
      mailtoFallback: "",
    });

    expect(href.startsWith("mailto:?subject=")).toBe(true);
  });
});
