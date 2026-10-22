import { describe, expect, it, beforeEach } from "vitest";

import {
  DIGEST_BROWSE_LAST_VIEWED_STORAGE_KEY,
  resolveContinueLastDigestBrowse,
  writeDigestBrowseLastViewedId,
} from "@/lib/resolve-continue-last-digest-browse";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";

function digest(id: string, generatedUtc: string, title: string): ArchitectureDigest {
  return {
    digestId: id,
    tenantId: "t",
    workspaceId: "w",
    projectId: "p",
    generatedUtc,
    title,
    summary: "",
    contentMarkdown: "",
    metadataJson: "{}",
  };
}

describe("resolve-continue-last-digest-browse", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when input is not an array", () => {
    expect(resolveContinueLastDigestBrowse(null)).toBeNull();
    expect(resolveContinueLastDigestBrowse({})).toBeNull();
    expect(resolveContinueLastDigestBrowse("nope")).toBeNull();
    expect(resolveContinueLastDigestBrowse([])).toBeNull();
  });

  it("prefers the stored digest id when it still exists", () => {
    writeDigestBrowseLastViewedId("d2");
    const rows = [
      digest("d1", "2026-07-01T00:00:00Z", "Older"),
      digest("d2", "2026-06-01T00:00:00Z", "Stored digest"),
    ];

    expect(resolveContinueLastDigestBrowse(rows)).toEqual({
      digestId: "d2",
      title: "Stored digest",
    });
  });

  it("falls back to the newest generated digest", () => {
    const rows = [
      digest("d1", "2026-07-01T00:00:00Z", "Older"),
      digest("d2", "2026-07-08T00:00:00Z", "Newest"),
    ];

    expect(resolveContinueLastDigestBrowse(rows)).toEqual({
      digestId: "d2",
      title: "Newest",
    });
    expect(window.localStorage.getItem(DIGEST_BROWSE_LAST_VIEWED_STORAGE_KEY)).toBeNull();
  });
});
