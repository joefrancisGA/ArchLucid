import { afterEach, describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_DEMO_SEEDED_SAMPLE_BRIDGE,
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA,
  PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
} from "@/lib/buyer-polish-copy";
import { FINISH_SETUP_SYSTEM_HEALTH_PATH } from "@/lib/finish-setup-wizard-steps";
import { resolveEmptyHomeDoThisNext } from "@/lib/resolve-empty-home-do-this-next";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

describe("resolveEmptyHomeDoThisNext", () => {
  const originalSelfHosted = process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;

  afterEach(() => {
    if (originalSelfHosted === undefined) {
      delete process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;
    } else {
      process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = originalSelfHosted;
    }
  });

  it("returns sample package action when setup readiness can begin", () => {
    const action = resolveEmptyHomeDoThisNext({
      setupContext: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: true,
      },
    });

    expect(action.kind).toBe("sample");
    expect(action.label).toBe(OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA);
    expect(action.href).toBe(showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId));
    expect(action.bridgeCopy).toBe(PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY);
  });

  it("prefers a featured sample href when the caller supplies one", () => {
    const action = resolveEmptyHomeDoThisNext({
      setupContext: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: true,
      },
      sampleHref: "/architecture/reviews/tenant-featured-run",
    });

    expect(action.kind).toBe("sample");
    expect(action.href).toBe("/architecture/reviews/tenant-featured-run");
  });

  it("returns sample package action while setup context is still loading", () => {
    const action = resolveEmptyHomeDoThisNext({ setupContext: null });

    expect(action.kind).toBe("sample");
    expect(action.label).toBe(OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA);
  });

  it("returns admin setup CTA when principal is not admin", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = "false";

    const action = resolveEmptyHomeDoThisNext({
      setupContext: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: false,
      },
    });

    expect(action.kind).toBe("setup");
    expect(action.label).toBe("Manage roles");
    expect(action.href).toBe(SETTINGS_USERS_PATH);
  });

  it("returns health setup CTA on self-hosted when health is not ready", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = "true";

    const action = resolveEmptyHomeDoThisNext({
      setupContext: {
        healthReady: false,
        healthLoadFailed: true,
        principalAdmin: true,
      },
    });

    expect(action.kind).toBe("setup");
    expect(action.label).toBe("Open system health");
    expect(action.href).toBe(FINISH_SETUP_SYSTEM_HEALTH_PATH);
  });

  it("skips setup blockers on demo-seeded Overview and opens the sample package (TB-1039)", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = "false";

    const action = resolveEmptyHomeDoThisNext({
      setupContext: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: false,
      },
      demoSeededOverview: true,
      sampleHref: "/architecture/reviews/claims-intake-modernization",
    });

    expect(action.kind).toBe("sample");
    expect(action.label).toBe(OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA);
    expect(action.href).toBe("/architecture/reviews/claims-intake-modernization");
    expect(action.bridgeCopy).toBe(OPERATOR_HOME_DEMO_SEEDED_SAMPLE_BRIDGE);
  });
});
