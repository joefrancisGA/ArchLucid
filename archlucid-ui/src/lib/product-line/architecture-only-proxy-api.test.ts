import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isArchitectureOnlyProxyApiBlocked,
  shouldSkipArchitectureOnlyProxyApi,
  shouldSkipArchitectureOnlyProxyApiFromEnv,
} from "@/lib/product-line/architecture-only-proxy-api";

describe("architecture-only-proxy-api", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks architecture-only proxy calls for the Security product line", () => {
    expect(isArchitectureOnlyProxyApiBlocked("security")).toBe(true);
    expect(isArchitectureOnlyProxyApiBlocked("architecture")).toBe(false);
  });

  it("reads the build env when no explicit product line is passed", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_PRODUCT", "security");

    expect(shouldSkipArchitectureOnlyProxyApiFromEnv()).toBe(true);
    expect(shouldSkipArchitectureOnlyProxyApi()).toBe(true);
  });

  it("honors an explicit product line override", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_PRODUCT", "architecture");

    expect(shouldSkipArchitectureOnlyProxyApi("security")).toBe(true);
    expect(shouldSkipArchitectureOnlyProxyApi("architecture")).toBe(false);
  });
});
