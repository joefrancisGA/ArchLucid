import { describe, expect, it, vi } from "vitest";

import { buildTryCliDemoCommand } from "./try-cli-demo-copy";

describe("try-cli-demo-copy", () => {
  it("interpolates the configured public API base URL", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_API_BASE_URL", "https://api.example.test/");

    expect(buildTryCliDemoCommand()).toBe("archlucid try --api-base-url https://api.example.test");
  });

  it("accepts an explicit API base override", () => {
    expect(buildTryCliDemoCommand("http://localhost:5128")).toBe(
      "archlucid try --api-base-url http://localhost:5128",
    );
  });
});
