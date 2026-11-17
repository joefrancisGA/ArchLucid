import { describe, expect, it } from "vitest";

import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

import {
  resolveSecureNowHomeEnvironmentNextStep,
  resolveSecureNowHomePrimaryReturnHref,
  resolveSecureNowPostDriftNextHref,
  SECURENOW_HOME_FIRST_HOUR_STOP_HREF,
} from "./securenow-home-next-step";

describe("securenow home next step", () => {
  it("routes collection gaps to cloud connections", () => {
    expect(
      resolveSecureNowHomeEnvironmentNextStep({
        needsCollection: true,
        selectedPathId: "",
        firstRankedPathId: "",
      }).href,
    ).toBe(CLOUD_CONNECTIONS_PATH);
  });

  it("routes an in-flight path inspect to first-hour stop", () => {
    expect(
      resolveSecureNowHomeEnvironmentNextStep({
        needsCollection: false,
        selectedPathId: "path-1",
        firstRankedPathId: "path-2",
      }).href,
    ).toBe(SECURENOW_HOME_FIRST_HOUR_STOP_HREF);
  });

  it("routes post-drift to ranked path inspect", () => {
    expect(resolveSecureNowPostDriftNextHref("path-a")).toBe(
      "/security/remediation-factory?pathId=path-a",
    );
  });

  it("aligns return-home primary href with home next step", () => {
    expect(
      resolveSecureNowHomePrimaryReturnHref({
        collectionComplete: true,
        selectedPathId: "",
        firstRankedPathId: "path-9",
      }),
    ).toBe("/security/remediation-factory?pathId=path-9");
  });
});
