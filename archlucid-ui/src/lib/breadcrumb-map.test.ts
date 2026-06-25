import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "./i18n";
import { SHOWCASE_BUYER_REVIEW_TITLE, SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "./showcase-static-demo";
import { getBreadcrumbs } from "./breadcrumb-map";

describe("getBreadcrumbs", () => {
  it("returns only Overview for root", () => {
    expect(getBreadcrumbs("/")).toEqual([{ label: OPERATOR_NAV_LINK_LABELS.home }]);
  });

  it("maps recommendation tuning breadcrumb to the nav label", () => {
    expect(getBreadcrumbs("/recommendation-learning")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Recommendation tuning" },
    ]);
  });

  it("uses New review on the wizard path when buyer-polished breadcrumbs are requested", () => {
    expect(getBreadcrumbs("/reviews/new", { buyerPolishedShell: true })).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "New review" },
    ]);
  });

  it("shortens the new-review path to Overview / New request", () => {
    expect(getBreadcrumbs("/reviews/new")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "New request" },
    ]);
  });

  it("labels UUID review segments as Review package", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(getBreadcrumbs(`/reviews/${id}`)).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Review packages", href: "/reviews" },
      { label: "Review package" },
    ]);
  });

  it("maps review provenance under the review package crumb", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(getBreadcrumbs(`/reviews/${id}/provenance`)).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Review packages", href: "/reviews" },
      { label: "Review package", href: `/reviews/${id}` },
      { label: "Evidence provenance" },
    ]);
  });

  it("maps showcase manifest detail trail", () => {
    expect(getBreadcrumbs(`/manifests/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`)).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Signed review records", href: "/manifests" },
      { label: "Claims Intake review package" },
    ]);
  });

  it("buyer-polished: showcase manifest detail uses signed review record trail", () => {
    expect(
      getBreadcrumbs(`/manifests/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`, { buyerPolishedShell: true }),
    ).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Signed review records", href: "/manifests" },
      { label: `${SHOWCASE_BUYER_REVIEW_TITLE} signed record` },
    ]);
  });

  it("maps governance approval lineage with demo request title", () => {
    expect(getBreadcrumbs("/governance/approval-requests/e2e-approval-001/lineage")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Governance", href: "/governance" },
      { label: "Approval requests", href: "/governance/approval-requests" },
      { label: "Sample approval record", href: "/governance/approval-requests/e2e-approval-001" },
      { label: "Lineage" },
    ]);
  });

  it("maps governance dashboard segments", () => {
    expect(getBreadcrumbs("/governance/dashboard")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Governance", href: "/governance" },
      { label: "Governance dashboard" },
    ]);
  });

  it("maps operator ROI dashboard as Overview / Portfolio overview", () => {
    expect(getBreadcrumbs("/dashboard")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Portfolio overview" },
    ]);
  });

  it("maps settings billing as Overview / Settings / Billing & plans", () => {
    expect(getBreadcrumbs("/settings/billing")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Settings", href: "/settings" },
      { label: "Billing & plans" },
    ]);
  });

  it("maps cloud connections under Integrations (not Settings)", () => {
    expect(getBreadcrumbs("/settings/cloud-connections")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Integrations", href: "/integrations/operations" },
      { label: "Cloud connections" },
    ]);
  });

  it("uses policy-pack registry trail for governance-scoped pack routes (no workflow parent link)", () => {
    expect(getBreadcrumbs("/governance/policy-packs/undefined")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Policy packs", href: "/policy-packs" },
      { label: "Policy pack detail" },
    ]);
  });

  it("redirect target path breadcrumb resolves to registry only", () => {
    expect(getBreadcrumbs("/governance/policy-packs")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Policy packs", href: "/policy-packs" },
    ]);
  });

  it("labels showcase demo slug before uuid-style titles", () => {
    expect(getBreadcrumbs("/showcase/claims-intake-modernization")).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Showcase", href: "/showcase" },
      { label: "Claims Intake Modernization" },
    ]);
  });

  it("buyer-polished: audit crumb reads Audit trail", () => {
    expect(getBreadcrumbs("/audit", { buyerPolishedShell: true })).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Audit trail" },
    ]);
  });

  it("buyer-polished: showcase runId on hub inserts review package title before the hub crumb", () => {
    expect(
      getBreadcrumbs("/graph", {
        buyerPolishedShell: true,
        queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
      }),
    ).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: SHOWCASE_BUYER_REVIEW_TITLE, href: `/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}` },
      { label: "Evidence graph" },
    ]);
  });

  it("does not inject review package crumb when runId is not a known demo or compare slug", () => {
    expect(
      getBreadcrumbs("/graph", {
        buyerPolishedShell: true,
        queryRunId: "other-review",
      }),
    ).toEqual([{ label: OPERATOR_NAV_LINK_LABELS.home, href: "/" }, { label: "Evidence graph" }]);
  });

  it("buyer-polished: compare demo runId on hub inserts review package title before the hub crumb", () => {
    expect(
      getBreadcrumbs("/audit", {
        buyerPolishedShell: true,
        queryRunId: "claims-intake-run-v1",
      }),
    ).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Baseline Claims Intake Review", href: "/reviews/claims-intake-run-v1" },
      { label: "Audit trail" },
    ]);
  });

  it("buyer-polished: showcase runId on governance findings inserts review package title after Overview", () => {
    expect(
      getBreadcrumbs("/governance/findings", {
        buyerPolishedShell: true,
        queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
      }),
    ).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: SHOWCASE_BUYER_REVIEW_TITLE, href: `/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}` },
      { label: "Governance", href: "/governance" },
      { label: "Findings" },
    ]);
  });

  it("buyer-polished: search hub with showcase runId inserts review package title before search crumb", () => {
    expect(
      getBreadcrumbs("/search", {
        buyerPolishedShell: true,
        queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
      }),
    ).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: SHOWCASE_BUYER_REVIEW_TITLE, href: `/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}` },
      { label: "Search review evidence" },
    ]);
  });

  it("buyer-polished: showcase review uses stable buyer review title and inspect trail label", () => {
    expect(
      getBreadcrumbs(
        "/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect",
        { buyerPolishedShell: true },
      ),
    ).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Review packages", href: "/reviews" },
      { label: SHOWCASE_BUYER_REVIEW_TITLE, href: "/reviews/claims-intake-modernization" },
      { label: "Findings", href: "/reviews/claims-intake-modernization/findings" },
      {
        label: "PHI minimization finding (High)",
        href: "/reviews/claims-intake-modernization/findings/phi-minimization-risk",
      },
      { label: "Evidence trace" },
    ]);
  });

  it("labels E2E demo finding segment under Review packages", () => {
    expect(
      getBreadcrumbs("/reviews/e2e-fixture-run-001/findings/e2e-finding-001"),
    ).toEqual([
      { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
      { label: "Review packages", href: "/reviews" },
      { label: "Claims Intake Modernization", href: "/reviews/e2e-fixture-run-001" },
      { label: "Findings", href: "/reviews/e2e-fixture-run-001/findings" },
      { label: "Demonstration finding" },
    ]);
  });
});
