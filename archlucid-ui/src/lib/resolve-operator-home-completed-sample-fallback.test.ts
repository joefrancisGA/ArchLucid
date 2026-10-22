import { beforeEach, describe, expect, it, vi } from "vitest";

const isStaticDemoPayloadFallbackEnabled = vi.fn(() => false);
const isShowcaseSpineStaticPayloadActiveForRun = vi.fn(() => false);
const shouldInjectDemoSeededOverviewSample = vi.fn(() => false);
const isDemoSeededOverviewWorkspaceLabel = vi.fn(() => false);
const getEffectiveBrowserProxyScopeHeaders = vi.fn(() => ({}));
const readOperatorScopeFromStorage = vi.fn(() => null);
const resolveDemoSeededOverviewSamplePackage = vi.fn(() => ({
  runId: "customer-intake-modernization",
  href: "/architecture/reviews/customer-intake-modernization",
  label: "Open sample review",
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => isStaticDemoPayloadFallbackEnabled(),
  isShowcaseSpineStaticPayloadActiveForRun: (runId: string) => isShowcaseSpineStaticPayloadActiveForRun(runId),
}));

vi.mock("@/lib/demo-seeded-overview", () => ({
  shouldInjectDemoSeededOverviewSample: (input: unknown) => shouldInjectDemoSeededOverviewSample(input),
  isDemoSeededOverviewWorkspaceLabel: (label: string | null | undefined) => isDemoSeededOverviewWorkspaceLabel(label),
  resolveDemoSeededOverviewSamplePackage: (scopeHeaders: unknown) =>
    resolveDemoSeededOverviewSamplePackage(scopeHeaders),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  getEffectiveBrowserProxyScopeHeaders: () => getEffectiveBrowserProxyScopeHeaders(),
  readOperatorScopeFromStorage: () => readOperatorScopeFromStorage(),
}));

import { resolveOperatorHomeCompletedSampleFallback } from "@/lib/resolve-operator-home-completed-sample-fallback";
import { OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("resolveOperatorHomeCompletedSampleFallback", () => {
  beforeEach(() => {
    isStaticDemoPayloadFallbackEnabled.mockReturnValue(false);
    isShowcaseSpineStaticPayloadActiveForRun.mockReturnValue(false);
    shouldInjectDemoSeededOverviewSample.mockReturnValue(false);
    isDemoSeededOverviewWorkspaceLabel.mockReturnValue(false);
    getEffectiveBrowserProxyScopeHeaders.mockReturnValue({});
    readOperatorScopeFromStorage.mockReturnValue(null);
  });

  it("returns the showcase review when static demo fallback is enabled", () => {
    isStaticDemoPayloadFallbackEnabled.mockReturnValue(true);

    expect(resolveOperatorHomeCompletedSampleFallback()).toEqual({
      href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
      label: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
    });
  });

  it("returns the demo-seeded overview sample on seeded scope", () => {
    shouldInjectDemoSeededOverviewSample.mockReturnValue(true);

    expect(resolveOperatorHomeCompletedSampleFallback()).toEqual({
      href: "/architecture/reviews/customer-intake-modernization",
      label: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
    });
  });

  it("returns the showcase review when showcase spine static payloads are active", () => {
    isShowcaseSpineStaticPayloadActiveForRun.mockReturnValue(true);

    expect(resolveOperatorHomeCompletedSampleFallback()).toEqual({
      href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
      label: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
    });
    expect(isShowcaseSpineStaticPayloadActiveForRun).toHaveBeenCalledWith(SHOWCASE_STATIC_DEMO_RUN_ID);
  });

  it("returns null when no curated fallback applies", () => {
    expect(resolveOperatorHomeCompletedSampleFallback()).toBeNull();
  });
});
