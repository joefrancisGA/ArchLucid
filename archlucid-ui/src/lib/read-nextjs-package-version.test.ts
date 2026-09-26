import { afterEach, describe, expect, it, vi } from "vitest";

import {
  nextJsPinMatchesInstalledPackage,
  readNextJsPackageVersion,
  readNextJsPinnedVersion,
} from "@/lib/read-nextjs-package-version";

describe("read-nextjs-package-version", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads installed and pinned versions from NEXT_PUBLIC env", () => {
    vi.stubEnv("NEXT_PUBLIC_NEXTJS_PACKAGE_VERSION", "16.3.6");
    vi.stubEnv("NEXT_PUBLIC_NEXTJS_PINNED_VERSION", "16.3.6");

    expect(readNextJsPackageVersion()).toBe("16.3.6");
    expect(readNextJsPinnedVersion()).toBe("16.3.6");
    expect(nextJsPinMatchesInstalledPackage()).toBe(true);
  });

  it("detects stale node_modules when pin and installed differ", () => {
    vi.stubEnv("NEXT_PUBLIC_NEXTJS_PACKAGE_VERSION", "16.3.5");
    vi.stubEnv("NEXT_PUBLIC_NEXTJS_PINNED_VERSION", "16.3.6");

    expect(nextJsPinMatchesInstalledPackage()).toBe(false);
  });

  it("returns unknown when env is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_NEXTJS_PACKAGE_VERSION", "");
    vi.stubEnv("NEXT_PUBLIC_NEXTJS_PINNED_VERSION", "");

    expect(readNextJsPackageVersion()).toBe("unknown");
    expect(readNextJsPinnedVersion()).toBe("unknown");
  });
});
