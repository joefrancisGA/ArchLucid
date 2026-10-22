import { describe, expect, it } from "vitest";

import {
  countVisibleCloudProviders,
  wouldLeaveNoVisibleCloudProviders,
} from "@/lib/cloud-platform-scope-validation";
import { DEFAULT_CLOUD_PLATFORM_SCOPE } from "@/lib/cloud-platform-scope-storage";

describe("cloud-platform-scope-validation", () => {
  it("counts visible providers", () => {
    expect(countVisibleCloudProviders(DEFAULT_CLOUD_PLATFORM_SCOPE)).toBe(3);
    expect(
      countVisibleCloudProviders({
        ...DEFAULT_CLOUD_PLATFORM_SCOPE,
        aws: false,
        azure: false,
      }),
    ).toBe(1);
  });

  it("detects when unchecking would hide every provider", () => {
    const onlyGcp = {
      ...DEFAULT_CLOUD_PLATFORM_SCOPE,
      aws: false,
      azure: false,
    };

    expect(wouldLeaveNoVisibleCloudProviders(onlyGcp, "gcp")).toBe(true);
    expect(wouldLeaveNoVisibleCloudProviders(DEFAULT_CLOUD_PLATFORM_SCOPE, "aws")).toBe(false);
  });
});
