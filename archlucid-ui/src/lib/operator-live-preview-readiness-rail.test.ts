import { describe, expect, it } from "vitest";

import {
  hasAlertRulesLivePreviewPinContent,
  hasExecDigestScheduleLivePreviewPinContent,
  OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND,
  shouldPinLivePreviewReadinessRail,
} from "@/lib/operator-live-preview-readiness-rail";

describe("operator-live-preview-readiness-rail (TB-1574)", () => {
  it("names the live rail kind for inventory/PR notes", () => {
    expect(OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND).toBe("live");
  });

  it("pins only when pin-worthy live content exists", () => {
    expect(shouldPinLivePreviewReadinessRail(false)).toBe(false);
    expect(shouldPinLivePreviewReadinessRail(true)).toBe(true);
  });

  it("keeps Alert rules empty default draft unpinned", () => {
    expect(
      hasAlertRulesLivePreviewPinContent({
        existingRuleCount: 0,
        draftDiffersFromDefault: false,
      }),
    ).toBe(false);
  });

  it("pins Alert rules when rules exist or the draft left defaults", () => {
    expect(
      hasAlertRulesLivePreviewPinContent({
        existingRuleCount: 1,
        draftDiffersFromDefault: false,
      }),
    ).toBe(true);
    expect(
      hasAlertRulesLivePreviewPinContent({
        existingRuleCount: 0,
        draftDiffersFromDefault: true,
      }),
    ).toBe(true);
  });

  it("keeps Digests Schedule sparse empty unpinned", () => {
    expect(
      hasExecDigestScheduleLivePreviewPinContent({
        isConfigured: false,
        recipientCount: 0,
        hasPreviewDigest: false,
      }),
    ).toBe(false);
  });

  it("pins Digests Schedule when configured, recipients, or preview digest exist", () => {
    expect(
      hasExecDigestScheduleLivePreviewPinContent({
        isConfigured: true,
        recipientCount: 0,
        hasPreviewDigest: false,
      }),
    ).toBe(true);
    expect(
      hasExecDigestScheduleLivePreviewPinContent({
        isConfigured: false,
        recipientCount: 1,
        hasPreviewDigest: false,
      }),
    ).toBe(true);
    expect(
      hasExecDigestScheduleLivePreviewPinContent({
        isConfigured: false,
        recipientCount: 0,
        hasPreviewDigest: true,
      }),
    ).toBe(true);
  });
});
