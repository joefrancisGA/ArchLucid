import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

describe("Next proxy matcher", () => {
  it("explicitly applies host gating to JSON API proxy paths", () => {
    expect(config.matcher).toContain("/api/proxy/:path*");
  });
});

describe("proxy synthetic forbidden shell", () => {
  const ENV_KEYS = ["ARCHLUCID_PUBLIC_SITE_URL", "ARCHLUCID_APP_SITE_URL"] as const;

  afterEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  it("returns 403 on the app host without demo-run alias rewrite", () => {
    const request = new NextRequest("http://localhost:3000/403");

    const response = proxy(request);

    expect(response.status).toBe(403);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not hand off marketing-host /403 to the app origin before returning 403", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://archlucid.net";
    process.env.ARCHLUCID_APP_SITE_URL = "https://app.archlucid.net";

    const request = new NextRequest("https://archlucid.net/403", {
      headers: { host: "archlucid.net" },
    });

    const response = proxy(request);

    expect(response.status).toBe(403);
    expect(response.headers.get("location")).toBeNull();
  });
});

describe("proxy api passthrough vs demo alias", () => {
  it("passes through /api/proxy paths without demo-run alias rewrite", () => {
    const request = new NextRequest("http://localhost:3000/api/proxy/v1/auth/bootstrap/status");

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("still rewrites /runs alias paths on the same app host", () => {
    const request = new NextRequest(
      "http://localhost:3000/runs/customer-intake-modernization-run/findings",
    );

    const response = proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toContain("/architecture/reviews/customer-intake-modernization/");
  });
});

describe("proxy demo-run alias redirect", () => {
  it("preserves query string when rewriting /runs alias paths", () => {
    const request = new NextRequest(
      "http://localhost:3000/runs/customer-intake-modernization-run/findings?src=email",
    );

    const response = proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/architecture/reviews/customer-intake-modernization/findings?src=email",
    );
  });
});
