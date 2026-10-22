import { describe, expect, it } from "vitest";

import { buildSelfDemoCtaHref, DEFAULT_SELF_DEMO_PATH } from "./build-self-demo-cta-href";

describe("buildSelfDemoCtaHref", () => {
  it("defaults to Workspace A run path and merges attribution params", () => {
    const params: URLSearchParams = new URLSearchParams();
    params.set("utm_source", "linkedin");

    const href: string = buildSelfDemoCtaHref(params, "https://localhost", DEFAULT_SELF_DEMO_PATH);

    expect(href).toContain(DEFAULT_SELF_DEMO_PATH);
    expect(href).toContain("utm_source=linkedin");
  });

  it("allows overriding the target path for staging or absolute URLs", () => {
    const params: URLSearchParams = new URLSearchParams();
    const href: string = buildSelfDemoCtaHref(params, "https://app.example", "/custom/tour");

    expect(href).toBe("https://app.example/custom/tour");
  });
});
