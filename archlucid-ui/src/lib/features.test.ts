import { afterEach, describe, expect, it, vi } from "vitest";

import { isShowSystemAdministrationNavEnabled, readArchLucidFeatureFlags } from "@/lib/features";

describe("ArchLucid feature flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults showSystemAdministrationNav to true in development when unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "");
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "");

    expect(readArchLucidFeatureFlags().features.showSystemAdministrationNav).toBe(true);
  });

  it("defaults showSystemAdministrationNav to false in production when unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "");
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "");

    expect(isShowSystemAdministrationNavEnabled()).toBe(false);
  });

  it("honors NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "true");

    expect(isShowSystemAdministrationNavEnabled()).toBe(true);
  });

  it("honors legacy NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR alias", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "1");

    expect(isShowSystemAdministrationNavEnabled()).toBe(true);
  });
});
