import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import {
  OPERATOR_CONNECTIVITY_CONFIG_HINT_GENERIC,
  resolveOperatorConnectivityTechnicalDetails,
} from "@/lib/operator/operator-connectivity-error-present";

describe("resolveOperatorConnectivityTechnicalDetails", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    buyerPolishedShellVitestOverride.value = null;
  });

  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = null;
  });

  it("builds technical details for upstream API unreachable failures", () => {
    const details = resolveOperatorConnectivityTechnicalDetails({
      message: "Upstream API unreachable: fetch failed",
      httpStatus: 502,
      problem: {
        title: "Upstream API unreachable",
        detail: "fetch failed",
        supportHint: "Check ARCHLUCID_API_BASE_URL and docs/runbooks/TROUBLESHOOTING.md.",
      },
      correlationId: "req-upstream-502",
    });

    expect(details).toMatchObject({
      kind: "upstream-unreachable",
      errorType: "Upstream API unreachable",
      cause: "fetch failed",
      correlationId: "req-upstream-502",
      configurationHint: OPERATOR_CONNECTIVITY_CONFIG_HINT_GENERIC,
    });
  });

  it("includes local configuration hints only in development operator shell", () => {
    vi.stubEnv("NODE_ENV", "development");
    buyerPolishedShellVitestOverride.value = false;

    const details = resolveOperatorConnectivityTechnicalDetails({
      message: "Upstream API unreachable",
      httpStatus: 502,
      problem: {
        title: "Upstream API unreachable",
        detail: "fetch failed",
        supportHint: "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local.",
      },
      correlationId: "req-local-dev",
    });

    expect(details?.localDevConfigurationHint).toContain("ARCHLUCID_API_BASE_URL");
  });

  it("omits local configuration hints in buyer-polished development shell", () => {
    vi.stubEnv("NODE_ENV", "development");
    buyerPolishedShellVitestOverride.value = true;

    const details = resolveOperatorConnectivityTechnicalDetails({
      message: "Upstream API unreachable",
      httpStatus: 502,
      problem: {
        title: "Upstream API unreachable",
        detail: "fetch failed",
        supportHint: "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local.",
      },
      correlationId: "req-local-dev-buyer",
    });

    expect(details?.localDevConfigurationHint).toBeNull();
  });

  it("omits local configuration hints outside development", () => {
    vi.stubEnv("NODE_ENV", "production");

    const details = resolveOperatorConnectivityTechnicalDetails({
      message: "Upstream API unreachable",
      httpStatus: 502,
      problem: {
        title: "Upstream API unreachable",
        detail: "fetch failed",
        supportHint: "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local.",
      },
      correlationId: "req-prod",
    });

    expect(details?.localDevConfigurationHint).toBeNull();
  });
});
