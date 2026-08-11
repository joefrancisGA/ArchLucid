import { describe, expect, it } from "vitest";

import {
  expectSourceContains,
  expectSourceNotContains,
  readPackageSource,
  readRegisteredSource,
  readSiblingSource,
  requireSourceIndex,
} from "./source-scan-harness";
import { SOURCE_SCAN_TARGETS, resolveSourceScanTargetPath } from "./source-scan-targets";

describe("source-scan harness", () => {
  it("resolves registered targets under the package root", () => {
    const absolute = resolveSourceScanTargetPath("run-detail-page-view");

    expect(absolute.replace(/\\/g, "/")).toContain(
      SOURCE_SCAN_TARGETS["run-detail-page-view"],
    );
  });

  it("reads registered source for a known UI module", () => {
    const source = readRegisteredSource("run-detail-page-view");

    expectSourceContains(source, "buildRunDetailPresentation", "run-detail-page-view");
    expectSourceNotContains(source, "from \"@/lib/run-detail-workspace-derive\"", "run-detail-page-view");
  });

  it("reads sibling source relative to this test file", () => {
    const source = readSiblingSource(import.meta.url, "source-scan-targets.ts");

    expectSourceContains(source, "SOURCE_SCAN_TARGETS", "source-scan-targets.ts");
  });

  it("reads package-relative source", () => {
    const source = readPackageSource("src/testing/source-scan-harness.ts");

    expectSourceContains(source, "readRegisteredSource", "harness");
  });

  it("requireSourceIndex fails clearly when the needle is absent", () => {
    const source = "abc";

    expect(() => requireSourceIndex(source, "zzz", "fixture")).toThrow();
  });
});
