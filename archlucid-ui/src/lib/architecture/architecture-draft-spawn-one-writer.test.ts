import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_TAB_SPAWN_ONE_WRITER_SNAPSHOT_HELPER,
  guidedIntakeRerunHref,
  resolveArchitectureTabCanEditSource,
  resolveArchitectureTabEditSourceHref,
  resolveArchitectureTabEditSourceHrefFromRunSummary,
  resolveArchitectureTabSubmittedHelperText,
} from "@/lib/architecture/architecture-draft-spawn-one-writer";

describe("architecture-draft-spawn-one-writer (SN-004)", () => {
  it("suppresses guided-intake edit source for Created-origin in-flight reviews", () => {
    expect(
      resolveArchitectureTabEditSourceHref({
        runId: "run-created",
        hasManifest: false,
        packageOrigin: "created",
      }),
    ).toBeNull();
  });

  it("keeps guided-intake edit source for Reviewed-origin in-flight reviews", () => {
    expect(
      resolveArchitectureTabEditSourceHref({
        runId: "run-reviewed",
        hasManifest: false,
        packageOrigin: "reviewed",
      }),
    ).toBe(guidedIntakeRerunHref("run-reviewed"));
  });

  it("clears edit source when the review has a finalized manifest", () => {
    expect(
      resolveArchitectureTabEditSourceHref({
        runId: "run-final",
        hasManifest: true,
        packageOrigin: "reviewed",
      }),
    ).toBeNull();
  });

  it("derives edit href from run summary package origin", () => {
    expect(
      resolveArchitectureTabEditSourceHrefFromRunSummary(
        { runId: "run-created", projectId: "default", packageOrigin: "Created" },
        false,
      ),
    ).toBeNull();
    expect(
      resolveArchitectureTabEditSourceHrefFromRunSummary(
        { runId: "run-reviewed", projectId: "default", packageOrigin: "Reviewed" },
        false,
      ),
    ).toBe(guidedIntakeRerunHref("run-reviewed"));
  });

  it("ties canEditSource to a non-null edit href", () => {
    expect(resolveArchitectureTabCanEditSource(null)).toBe(false);
    expect(resolveArchitectureTabCanEditSource(guidedIntakeRerunHref("run-1"))).toBe(true);
  });

  it("uses snapshot helper copy for Created-origin Architecture tab", () => {
    expect(
      resolveArchitectureTabSubmittedHelperText({
        packageOrigin: "created",
        hasManifest: false,
        defaultHelper: "Default helper",
      }),
    ).toBe(ARCHITECTURE_TAB_SPAWN_ONE_WRITER_SNAPSHOT_HELPER);
    expect(
      resolveArchitectureTabSubmittedHelperText({
        packageOrigin: "reviewed",
        hasManifest: false,
        defaultHelper: "Default helper",
      }),
    ).toBe("Default helper");
  });
});
