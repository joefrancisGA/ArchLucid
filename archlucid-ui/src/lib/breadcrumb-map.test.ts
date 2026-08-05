import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { ARCHITECTURE_DRAFTS_LIST_LABEL, CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";

import { ALERTS_CONFIGURATION_PAGE_TITLE } from "./alerts-page-copy";
import { OPERATOR_NAV_LINK_LABELS } from "./i18n";
import { SHOWCASE_BUYER_REVIEW_TITLE, SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "./showcase-static-demo";
import { getBreadcrumbs } from "./breadcrumb-map";

describe("getBreadcrumbs", () => {
  it("returns only Overview for root", () => {
    expect(getBreadcrumbs("/")).toEqual([{ label: OPERATOR_NAV_LINK_LABELS.home }]);
  });

  it("maps internal recommendation learning breadcrumbs", () => {
    expect(getBreadcrumbs("/internal-operations/recommendation-learning")).toEqual([
      { label: "Internal Operations", href: "/admin/health" },
      { label: "Recommendation Learning" },
    ]);
  });

  it("maps internal product-learning breadcrumbs", () => {
    expect(getBreadcrumbs("/internal/product-learning")).toEqual([
      { label: "Internal Operations", href: "/admin/health" },
      { label: OPERATOR_NAV_LINK_LABELS.pilotFeedback },
    ]);
  });

  it("uses Start review on the wizard path when buyer-polished breadcrumbs are requested", () => {
    expect(getBreadcrumbs("/architecture/reviews/new", { buyerPolishedShell: true })).toEqual([
      { label: START_REVIEW_LABEL },
    ]);
  });

  it("shortens the new-review path to a single wizard crumb", () => {
    expect(getBreadcrumbs("/architecture/reviews/new")).toEqual([
      { label: START_REVIEW_LABEL },
    ]);
  });

  it("labels architecture inventory and create/draft crumbs under Architectures (not Drafts)", () => {
    expect(ARCHITECTURE_DRAFTS_LIST_LABEL).toBe("Architectures");
    expect(getBreadcrumbs("/architecture/architectures")).toEqual([{ label: ARCHITECTURE_DRAFTS_LIST_LABEL }]);
    expect(getBreadcrumbs("/architecture/architectures/new")).toEqual([
      { label: ARCHITECTURE_DRAFTS_LIST_LABEL, href: "/architecture/architectures" },
      { label: CREATE_ARCHITECTURE_LABEL },
    ]);
    expect(getBreadcrumbs("/architecture/architectures/draft-001")).toEqual([
      { label: ARCHITECTURE_DRAFTS_LIST_LABEL, href: "/architecture/architectures" },
      { label: CREATE_ARCHITECTURE_LABEL },
    ]);
  });


  it("labels UUID review segments as Review", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(getBreadcrumbs(`/architecture/reviews/${id}`)).toEqual([
      { label: "Reviews", href: "/architecture/reviews" },
      { label: "Review" },
    ]);
  });

  it("maps review provenance under the review crumb", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(getBreadcrumbs(`/architecture/reviews/${id}/provenance`)).toEqual([
      { label: "Reviews", href: "/architecture/reviews" },
      { label: "Review", href: `/architecture/reviews/${id}` },
      { label: "Evidence provenance" },
    ]);
  });

  it("maps showcase manifest detail trail", () => {
    expect(getBreadcrumbs(`/governance/signed-records/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`)).toEqual([
      { label: "Signed review records", href: "/governance/signed-records" },
      { label: "Claims Intake review" },
    ]);
  });

  it("buyer-polished: showcase manifest detail uses signed review record trail", () => {
    expect(
      getBreadcrumbs(`/governance/signed-records/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`, { buyerPolishedShell: true }),
    ).toEqual([
      { label: "Signed review records", href: "/governance/signed-records" },
      { label: `${SHOWCASE_BUYER_REVIEW_TITLE} signed record` },
    ]);
  });

  it("maps governance approval lineage with demo request title", () => {
    expect(getBreadcrumbs("/governance/approval-requests/e2e-approval-001/lineage")).toEqual([
      { label: "Governance", href: "/governance/approval-queue" },
      { label: "Approval requests", href: "/governance/approval-requests" },
      { label: "Sample approval record", href: "/governance/approval-requests/e2e-approval-001" },
      { label: "Lineage" },
    ]);
  });

  it("maps governance dashboard segments", () => {
    expect(getBreadcrumbs("/governance/dashboard")).toEqual([
      { label: "Governance", href: "/governance/approval-queue" },
      { label: "Governance dashboard" },
    ]);
  });

  it("maps operator ROI dashboard as portfolio overview", () => {
    expect(getBreadcrumbs(EXECUTIVE_DASHBOARD_HREF)).toEqual([
      { label: "Architecture" },
      { label: "Executive dashboard" },
    ]);
  });

  it("maps workspace settings under the Settings hub rather than as its own root", () => {
    expect(getBreadcrumbs("/administration/tenant")).toEqual([
      { label: "Administration" },
      { label: "Settings", href: "/administration" },
      { label: "Workspace settings" },
    ]);
  });

  it("maps the projects recycle bin under Settings / Workspace settings", () => {
    expect(getBreadcrumbs("/administration/tenant/recycle-bin")).toEqual([
      { label: "Settings", href: "/administration" },
      { label: "Workspace settings", href: "/administration/tenant" },
      { label: "Projects recycle bin" },
    ]);
  });

  it("maps settings billing as Administration / Settings / Billing & plans", () => {
    expect(getBreadcrumbs("/administration/billing")).toEqual([
      { label: "Administration" },
      { label: "Settings", href: "/administration" },
      { label: "Billing & plans" },
    ]);
  });

  it("maps SSO wizard as Settings / Identity providers / Configure SSO", () => {
    expect(getBreadcrumbs("/administration/identity/sso-wizard")).toEqual([
      { label: "Settings", href: "/administration" },
      { label: "Identity providers", href: "/administration/identity-providers" },
      { label: "Configure SSO" },
    ]);
  });

  it("maps SCIM provisioning as Settings / Identity providers / SCIM provisioning", () => {
    expect(getBreadcrumbs("/administration/scim-provisioning")).toEqual([
      { label: "Settings", href: "/administration" },
      { label: "Identity providers", href: "/administration/identity-providers" },
      { label: "SCIM provisioning" },
    ]);
  });

  it("maps cloud connections under Integrations (not Settings)", () => {
    expect(getBreadcrumbs("/integrations/cloud-connections")).toEqual([
      { label: "Integrations" },
      { label: "Cloud connections" },
    ]);
  });

  it("maps connection status under Administration", () => {
    expect(getBreadcrumbs("/administration/connection-status")).toEqual([
      { label: "Administration" },
      { label: "Connection status" },
    ]);
  });

  it("maps system health under Administration", () => {
    expect(getBreadcrumbs("/administration/system-health")).toEqual([
      { label: "Administration" },
      { label: "System health" },
    ]);
  });

  it("maps cloud connections help without generic Cloud connections segment", () => {
    expect(getBreadcrumbs("/help/cloud-connections/azure")).toEqual([
      { label: "Support", href: "/help" },
      { label: "Cloud connections", href: "/integrations/cloud-connections" },
      { label: "Azure" },
    ]);
    expect(getBreadcrumbs("/help/cloud-connections/aws")).toEqual([
      { label: "Help", href: "/help" },
      { label: "Cloud connections", href: "/integrations/cloud-connections" },
    ]);
    expect(getBreadcrumbs("/help/cloud-connections/gcp")).toEqual([
      { label: "Help", href: "/help" },
      { label: "Cloud connections", href: "/integrations/cloud-connections" },
    ]);
    expect(getBreadcrumbs("/help/azure-permissions")).toEqual([
      { label: "Support", href: "/help" },
      { label: "Cloud connections", href: "/integrations/cloud-connections" },
      { label: "Azure permissions" },
    ]);
  });

  it("maps the workspace and scope guide breadcrumb to match its page title", () => {
    expect(getBreadcrumbs("/help/scope")).toEqual([
      { label: "Help", href: "/help" },
      { label: "Workspace and scope" },
    ]);
  });

  it("maps how-it-works and data-handling breadcrumbs to page titles", () => {
    expect(getBreadcrumbs("/help/how-it-works")).toEqual([
      { label: "Help", href: "/help" },
      { label: "How ArchLucid works" },
    ]);
    expect(getBreadcrumbs("/help/data-handling")).toEqual([
      { label: "Help", href: "/help" },
      { label: "What ArchLucid does with your data" },
    ]);
  });

  it("maps core-pilot breadcrumb to the buyer page title (TB-1041)", () => {
    expect(getBreadcrumbs("/help/first-architecture-review")).toEqual([
      { label: "Help", href: "/help" },
      { label: "Your first architecture review" },
    ]);
  });

  it("uses policy-pack registry trail for governance-scoped pack routes (no workflow parent link)", () => {
    expect(getBreadcrumbs("/governance/policy-packs/undefined")).toEqual([
      { label: "Policy packs", href: "/governance/policy-packs" },
      { label: "Policy pack detail" },
    ]);
  });

  it("redirect target path breadcrumb resolves to registry only", () => {
    expect(getBreadcrumbs("/governance/policy-packs")).toEqual([
      { label: "Policy packs", href: "/governance/policy-packs" },
    ]);
  });

  it("labels Responsible AI policy pack id 1 with a human-readable breadcrumb", () => {
    expect(getBreadcrumbs("/governance/policy-packs/1")).toEqual([
      { label: "Policy packs", href: "/governance/policy-packs" },
      { label: "Responsible AI" },
    ]);
  });

  it("labels showcase demo slug before uuid-style titles", () => {
    expect(getBreadcrumbs("/showcase/claims-intake-modernization")).toEqual([
      { label: "Showcase", href: "/showcase" },
      { label: "Claims Intake Modernization" },
    ]);
  });

  it("buyer-polished: audit crumb reads Audit trail under governance", () => {
    expect(getBreadcrumbs("/governance/audit", { buyerPolishedShell: true })).toEqual([
      { label: "Governance", href: "/governance/approval-queue" },
      { label: "Audit trail" },
    ]);
  });

  it("buyer-polished: showcase runId on hub inserts review title before the hub crumb", () => {
    expect(
      getBreadcrumbs("/insights/evidence-graph", {
        buyerPolishedShell: true,
        queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
      }),
    ).toEqual([
      { label: SHOWCASE_BUYER_REVIEW_TITLE, href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}` },
      { label: "Evidence graph" },
    ]);
  });

  it("does not inject review crumb when runId is not a known demo or compare slug", () => {
    expect(
      getBreadcrumbs("/insights/evidence-graph", {
        buyerPolishedShell: true,
        queryRunId: "other-review",
      }),
    ).toEqual([{ label: "Evidence graph" }]);
  });

  it("buyer-polished: compare demo runId on hub inserts review title before the hub crumb", () => {
    expect(
      getBreadcrumbs("/audit", {
        buyerPolishedShell: true,
        queryRunId: "claims-intake-run-v1",
      }),
    ).toEqual([
      { label: "Baseline Claims Intake Review", href: "/architecture/reviews/claims-intake-run-v1" },
      { label: "Audit trail" },
    ]);
  });

  it("buyer-polished: showcase runId on governance findings inserts review title before governance crumbs", () => {
    expect(
      getBreadcrumbs("/governance/findings", {
        buyerPolishedShell: true,
        queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
      }),
    ).toEqual([
      { label: SHOWCASE_BUYER_REVIEW_TITLE, href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}` },
      { label: "Governance", href: "/governance/approval-queue" },
      { label: "Findings" },
    ]);
  });

  it("maps governance findings as Findings breadcrumb", () => {
    expect(getBreadcrumbs("/governance/findings")).toEqual([
      { label: "Governance", href: "/governance/approval-queue" },
      { label: "Findings" },
    ]);
  });

  it("maps governance exceptions breadcrumb", () => {
    expect(getBreadcrumbs("/governance/exceptions")).toEqual([
      { label: "Governance", href: "/governance/approval-queue" },
      { label: "Exceptions" },
    ]);
  });

  it("buyer-polished: search hub with showcase runId inserts review title before search crumb", () => {
    expect(
      getBreadcrumbs("/insights/search-review-evidence", {
        buyerPolishedShell: true,
        queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
      }),
    ).toEqual([
      { label: SHOWCASE_BUYER_REVIEW_TITLE, href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}` },
      { label: "Search review evidence" },
    ]);
  });

  it("buyer-polished: showcase review uses stable buyer review title and evidence trace label", () => {
    expect(
      getBreadcrumbs(
        "/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk/evidence-trace",
        { buyerPolishedShell: true },
      ),
    ).toEqual([
      { label: "Reviews", href: "/architecture/reviews" },
      { label: SHOWCASE_BUYER_REVIEW_TITLE, href: "/architecture/reviews/claims-intake-modernization" },
      { label: "Findings", href: "/architecture/reviews/claims-intake-modernization/findings" },
      {
        label: "PHI minimization finding (High)",
        href: "/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk",
      },
      { label: "Evidence trace" },
    ]);
  });

  it("buyer-polished: legacy inspect segment still labels as Evidence trace", () => {
    expect(
      getBreadcrumbs(
        "/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect",
        { buyerPolishedShell: true },
      ),
    ).toEqual([
      { label: "Reviews", href: "/architecture/reviews" },
      { label: SHOWCASE_BUYER_REVIEW_TITLE, href: "/architecture/reviews/claims-intake-modernization" },
      { label: "Findings", href: "/architecture/reviews/claims-intake-modernization/findings" },
      {
        label: "PHI minimization finding (High)",
        href: "/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk",
      },
      { label: "Evidence trace" },
    ]);
  });

  it("labels E2E demo finding segment under Reviews", () => {
    expect(
      getBreadcrumbs("/architecture/reviews/e2e-fixture-run-001/findings/e2e-finding-001"),
    ).toEqual([
      { label: "Reviews", href: "/architecture/reviews" },
      { label: "Claims Intake Modernization", href: "/architecture/reviews/e2e-fixture-run-001" },
      { label: "Findings", href: "/architecture/reviews/e2e-fixture-run-001/findings" },
      { label: "Demonstration finding" },
    ]);
  });

  it("capitalizes ITSM acronym in admin integrations breadcrumb", () => {
    expect(getBreadcrumbs("/admin/integrations/itsm")).toEqual([
      { label: "Admin", href: "/admin" },
      { label: "Integrations", href: "/admin/integrations" },
      { label: "ITSM connectors" },
    ]);
  });

  it("TB-528: maps governance with runId to Reviews · title · Governance", () => {
    expect(
      getBreadcrumbs("/governance/approval-queue", {
        queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
      }),
    ).toEqual([
      { label: "Reviews", href: "/architecture/reviews" },
      {
        label: SHOWCASE_BUYER_REVIEW_TITLE,
        href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
      },
      { label: "Governance" },
    ]);
  });

  it("TB-528: legacy /audit path maps to Governance · Audit trail", () => {
    expect(getBreadcrumbs("/audit")).toEqual([
      { label: "Governance", href: "/governance/approval-queue" },
      { label: "Audit trail" },
    ]);
  });

  it("maps alert configuration route to Governance / Alerts", () => {
    expect(getBreadcrumbs("/governance/alert-rules")).toEqual([
      { label: "Governance", href: "/governance/approval-queue" },
      { label: ALERTS_CONFIGURATION_PAGE_TITLE },
    ]);
  });
});
