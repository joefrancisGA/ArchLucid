import { describe, expect, it } from "vitest";

import { appendMarketingAttributionToUrl } from "./append-marketing-attribution-to-url";

describe("appendMarketingAttributionToUrl", () => {
  it("merges UTM from search params into an absolute URL", () => {
    const params: URLSearchParams = new URLSearchParams();
    params.set("utm_source", "email");
    params.set("utm_campaign", "spring");

    const href: string = appendMarketingAttributionToUrl(
      "https://booking.example/intro",
      params,
      "https://app.example",
    );

    expect(href).toContain("utm_source=email");
    expect(href).toContain("utm_campaign=spring");
    expect(href.startsWith("https://booking.example/intro")).toBe(true);
  });

  it("preserves existing query on the base and can override matching keys", () => {
    const params: URLSearchParams = new URLSearchParams();
    params.set("utm_source", "hero");

    const href: string = appendMarketingAttributionToUrl(
      "https://booking.example/path?foo=1&utm_source=old",
      params,
      "https://app.example",
    );

    const url: URL = new URL(href);
    expect(url.searchParams.get("foo")).toBe("1");
    expect(url.searchParams.get("utm_source")).toBe("hero");
  });
});
