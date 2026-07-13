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
    expect(resolveInAppDocHref("docs/library/KNOWLEDGE_GRAPH.md")).toBe("/help/evidence-trail");
  });

  it("falls back to /help for unmapped contributor docs", () => {
    expect(resolveInAppDocHref("docs/BUILD.md")).toBe("/help");

    expect(resolveInAppDocHref("docs/runbooks/TROUBLESHOOTING.md")).toBe("/help/developer-troubleshooting");
    expect(resolveInAppDocHref("docs/library/customer-facing/OPERATOR_TROUBLESHOOTING.md")).toBe("/help/troubleshooting");
  });

  it("maps procurement and assurance docs to in-app help", () => {
    expect(resolveInAppDocHref("docs/go-to-market/DPA_TEMPLATE.md")).toBe("/help/dpa-template");
    expect(resolveInAppDocHref("docs/go-to-market/SUBPROCESSORS.md")).toBe("/help/subprocessors");
    expect(resolveInAppDocHref("docs/security/SOC2_SELF_ASSESSMENT_2026.md")).toBe("/help/soc2-self-assessment");
    expect(resolveInAppDocHref("docs/security/CAIQ_LITE_2026.md")).toBe("/help/caiq-sig-response");
    expect(resolveInAppDocHref("docs/go-to-market/SECURITY_REVIEWER_ONE_PAGER.md")).toBe("/help/security-policies");
    expect(resolveInAppDocHref("docs/library/SECOND_RUN.md")).toBe("/help/repeat-review-loop");
  });

  it("returns null from tryResolve for retired or contributor-only docs", () => {
    expect(tryResolveInAppDocHref("docs/BUILD.md")).toBeNull();
    expect(tryResolveInAppDocHref("docs/go-to-market/PRIVACY_POLICY.md")).toBeNull();
    expect(tryResolveInAppDocHref("docs/go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md")).toBeNull();
    expect(tryResolveInAppDocHref("docs/quality/game-day-log/README.md")).toBeNull();
    expect(tryResolveInAppDocHref("docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md")).toBeNull();
    expect(tryResolveInAppDocHref("docs/library/PRODUCT_PACKAGING.md")).toBeNull();
    expect(tryResolveInAppDocHref("docs/library/OPERATOR_ATLAS.md")).toBe("/help/pilot-nav-profile");
  });
});
