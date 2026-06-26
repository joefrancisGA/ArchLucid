import { describe, expect, it } from "vitest";

import { resolveInAppDocHref, tryResolveInAppDocHref } from "./in-app-doc-href";

describe("resolveInAppDocHref", () => {
  it("maps registry primary paths to /help/{slug}", () => {
    expect(resolveInAppDocHref("docs/CORE_PILOT.md")).toBe("/help/core-pilot");
    expect(resolveInAppDocHref("/docs/library/CLI_USAGE.md")).toBe("/help/cli-usage");
  });

  it("preserves hash fragments", () => {
    expect(resolveInAppDocHref("/docs/CORE_PILOT.md#checklist")).toBe("/help/core-pilot#checklist");
  });

  it("maps alias paths from help topics", () => {
    expect(resolveInAppDocHref("docs/library/COMPARISON_REPLAY.md")).toBe("/help/comparison-replay");
    expect(resolveInAppDocHref("docs/library/KNOWLEDGE_GRAPH.md")).toBe("/help/knowledge-graph");
  });

  it("falls back to /help for unmapped contributor docs", () => {
    expect(resolveInAppDocHref("docs/BUILD.md")).toBe("/help");

    expect(resolveInAppDocHref("docs/runbooks/TROUBLESHOOTING.md")).toBe("/help/developer-troubleshooting");
    expect(resolveInAppDocHref("docs/library/customer-facing/OPERATOR_TROUBLESHOOTING.md")).toBe("/help/troubleshooting");
  });

  it("maps procurement and assurance docs to in-app help", () => {
    expect(resolveInAppDocHref("docs/go-to-market/PRIVACY_POLICY.md")).toBe("/help/privacy-policy");
    expect(resolveInAppDocHref("docs/go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md")).toBe(
      "/help/example-roi-bulletin",
    );
    expect(resolveInAppDocHref("docs/quality/game-day-log/README.md")).toBe("/help/resilience-exercises");
    expect(resolveInAppDocHref("docs/library/SECOND_RUN.md")).toBe("/help/repeat-review-loop");
  });

  it("returns null from tryResolve for unmapped contributor docs", () => {
    expect(tryResolveInAppDocHref("docs/BUILD.md")).toBeNull();
    expect(tryResolveInAppDocHref("docs/library/OPERATOR_ATLAS.md")).toBe("/help/operator-shell");
  });
});
