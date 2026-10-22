import { afterEach, describe, expect, it, vi } from "vitest";

import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import {
  MANIFEST_DETAIL_DEFAULT_TAB,
  MANIFEST_DETAIL_TAB_PARAM,
  buildManifestDetailSectionTabHref,
  readManifestDetailSectionTabFromWindowLocation,
  resolveManifestDetailSectionTab,
  resolveManifestDetailSectionTabFromHash,
  writeManifestDetailSectionTabToUrl,
} from "@/lib/manifest-detail-section-tabs";

describe("manifest-detail-section-tabs", () => {
  it("resolves unknown tab params to Decision", () => {
    expect(resolveManifestDetailSectionTab(null)).toBe(MANIFEST_DETAIL_DEFAULT_TAB);
    expect(resolveManifestDetailSectionTab("not-a-tab")).toBe(MANIFEST_DETAIL_DEFAULT_TAB);
    expect(resolveManifestDetailSectionTab("evidence")).toBe("evidence");
  });

  it("maps stacked-layout hashes onto the tab that now owns that section", () => {
    expect(resolveManifestDetailSectionTabFromHash("manifest-decision-group")).toBe("decision");
    expect(resolveManifestDetailSectionTabFromHash("#manifest-overview")).toBe("decision");
    expect(resolveManifestDetailSectionTabFromHash("manifest-decisions")).toBe("decision");
    expect(resolveManifestDetailSectionTabFromHash("manifest-monitored-risk")).toBe("decision");
    expect(resolveManifestDetailSectionTabFromHash("manifest-deliverables")).toBe("evidence");
    expect(resolveManifestDetailSectionTabFromHash("manifest-bundle-zip")).toBe("downloads");
    expect(resolveManifestDetailSectionTabFromHash("#manifest-ask")).toBe("diligence");
    expect(resolveManifestDetailSectionTabFromHash("unknown-anchor")).toBeNull();
    expect(resolveManifestDetailSectionTabFromHash("")).toBeNull();
    expect(resolveManifestDetailSectionTabFromHash(null)).toBeNull();
  });

  it("builds shareable tab hrefs with the tab query param", () => {
    const detailPath = signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID);

    expect(buildManifestDetailSectionTabHref(SHOWCASE_STATIC_DEMO_MANIFEST_ID, "evidence")).toBe(
      `${detailPath}?${MANIFEST_DETAIL_TAB_PARAM}=evidence`,
    );
    expect(
      buildManifestDetailSectionTabHref(SHOWCASE_STATIC_DEMO_MANIFEST_ID, "decision", {
        hash: "manifest-decisions",
      }),
    ).toBe(`${detailPath}?${MANIFEST_DETAIL_TAB_PARAM}=decision#manifest-decisions`);
  });

  it("writes and reads tab from the browser location without navigation", () => {
    window.history.replaceState({}, "", "/governance/sealed-records/demo-1");
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    writeManifestDetailSectionTabToUrl("downloads");

    expect(replaceStateSpy).toHaveBeenCalled();
    expect(readManifestDetailSectionTabFromWindowLocation()).toBe("downloads");
    expect(window.location.search).toContain(`${MANIFEST_DETAIL_TAB_PARAM}=downloads`);
  });

  it("prefers hash-mapped tabs when reading from window location", () => {
    window.history.replaceState(
      {},
      "",
      "/governance/sealed-records/demo-1?tab=decision#manifest-ask",
    );

    expect(readManifestDetailSectionTabFromWindowLocation()).toBe("diligence");
  });
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});
