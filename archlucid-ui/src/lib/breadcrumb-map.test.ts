import { describe, expect, it } from "vitest";

import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE } from "./showcase-static-demo";
import { getBreadcrumbs } from "./breadcrumb-map";

describe("getBreadcrumbs", () => {
  it("returns only Home for root", () => {
    expect(getBreadcrumbs("/")).toEqual([{ label: "Home" }]);
  });

  it("uses New review on the wizard path when buyer-polished breadcrumbs are requested", () => {
    expect(getBreadcrumbs("/reviews/new", { buyerPolishedShell: true })).toEqual([
      { label: "Home", href: "/" },
      { label: "New review" },
    ]);
  });

  it("shortens the new-review path to Home / New request", () => {
    expect(getBreadcrumbs("/reviews/new")).toEqual([
      { label: "Home", href: "/" },
      { label: "New request" },
    ]);
  });

  it("labels UUID review segments as Review detail", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(getBreadcrumbs(`/reviews/${id}`)).toEqual([
      { label: "Home", href: "/" },
      { label: "Architecture reviews", href: "/reviews" },
      { label: "Review detail" },
    ]);
  });

  it("maps governance dashboard segments", () => {
    expect(getBreadcrumbs("/governance/dashboard")).toEqual([
      { label: "Home", href: "/" },
      { label: "Governance", href: "/governance" },
      { label: "Dashboard" },
    ]);
  });

  it("maps executive ROI dashboard as Home / Executive summary", () => {
    expect(getBreadcrumbs("/dashboard")).toEqual([
      { label: "Home", href: "/" },
      { label: "Executive summary" },
    ]);
  });

  it("maps settings billing as Home / Settings / Billing & plans", () => {
    expect(getBreadcrumbs("/settings/billing")).toEqual([
      { label: "Home", href: "/" },
      { label: "Settings", href: "/settings" },
      { label: "Billing & plans" },
    ]);
  });

  it("uses policy-pack registry trail for governance-scoped pack routes (no workflow parent link)", () => {
    expect(getBreadcrumbs("/governance/policy-packs/undefined")).toEqual([
      { label: "Home", href: "/" },
      { label: "Policy packs", href: "/policy-packs" },
      { label: "Policy pack detail" },
    ]);
  });

  it("redirect target path breadcrumb resolves to registry only", () => {
    expect(getBreadcrumbs("/governance/policy-packs")).toEqual([
      { label: "Home", href: "/" },
      { label: "Policy packs", href: "/policy-packs" },
    ]);
  });

  it("labels showcase demo slug before uuid-style titles", () => {
    expect(getBreadcrumbs("/showcase/claims-intake-modernization")).toEqual([
      { label: "Home", href: "/" },
      { label: "Showcase", href: "/showcase" },
      { label: "Claims Intake Modernization" },
    ]);
  });

  it("buyer-polished: audit crumb reads Audit Trail", () => {
    expect(getBreadcrumbs("/audit", { buyerPolishedShell: true })).toEqual([
      { label: "Home", href: "/" },
      { label: "Audit Trail" },
    ]);
  });

  it("buyer-polished: showcase review uses Review Package title and inspect trail label", () => {
    expect(
      getBreadcrumbs(
        "/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect",
        { buyerPolishedShell: true },
      ),
    ).toEqual([
      { label: "Home", href: "/" },
      { label: "Reviews", href: "/reviews" },
      { label: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, href: "/reviews/claims-intake-modernization" },
      { label: "Finding", href: "/reviews/claims-intake-modernization/findings" },
      {
        label: "High severity: PHI minimization risk",
        href: "/reviews/claims-intake-modernization/findings/phi-minimization-risk",
      },
      { label: "Evidence trace" },
    ]);
  });

  it("labels E2E demo finding segment under Architecture reviews", () => {
    expect(
      getBreadcrumbs("/reviews/e2e-fixture-run-001/findings/e2e-finding-001"),
    ).toEqual([
      { label: "Home", href: "/" },
      { label: "Architecture reviews", href: "/reviews" },
      { label: "Claims Intake Modernization", href: "/reviews/e2e-fixture-run-001" },
      { label: "Findings", href: "/reviews/e2e-fixture-run-001/findings" },
      { label: "Demonstration finding" },
    ]);
  });
});
