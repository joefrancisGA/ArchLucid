import { describe, expect, it } from "vitest";

import {
  CLOUD_PROVIDER_LAST_VIEWED_STORAGE_KEY,
  resolveContinueLastCloudProvider,
} from "@/lib/resolve-continue-last-cloud-provider";

describe("resolveContinueLastCloudProvider", () => {
  it("returns the stored provider when it is still visible", () => {
    window.localStorage.setItem(CLOUD_PROVIDER_LAST_VIEWED_STORAGE_KEY, "gcp");

    const match = resolveContinueLastCloudProvider({
      visibleProviders: ["aws", "azure", "gcp"],
      successfulPullByProvider: { aws: true, azure: false, gcp: false },
    });

    expect(match?.provider).toBe("gcp");
    expect(match?.href).toBe("/integrations/cloud-connections/gcp");
  });

  it("falls back to the first visible provider with a successful pull", () => {
    window.localStorage.removeItem(CLOUD_PROVIDER_LAST_VIEWED_STORAGE_KEY);

    const match = resolveContinueLastCloudProvider({
      visibleProviders: ["aws", "azure", "gcp"],
      successfulPullByProvider: { aws: false, azure: true, gcp: true },
    });

    expect(match?.provider).toBe("azure");
    expect(match?.name).toBe("Azure");
  });
});
