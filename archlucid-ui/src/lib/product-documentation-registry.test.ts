import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE } from "@/lib/enterprise-onboarding-help-copy";
import { CUSTOMER_GLOSSARY_CONTRACT_VERSION } from "@/lib/customer-glossary-manifest";

import {
  isInternalRunbookSlug,
  PRODUCT_DOCUMENTATION_CONTENT_KIND_BY_SLUG,
  type ProductDocumentationContentKind,
} from "@/lib/product-documentation-content-kinds";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";
import {
  getProductDocumentationEntry,
  inAppHelpHref,
  listProductDocumentationEntries,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";
import { getHelpCenterTier } from "@/lib/help/help-center-catalog";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const REDIRECT_STUB_MARKERS = [/moved\s+—/i, /^#\s*moved\b/i];

function isRedirectStubMarkdown(markdown: string): boolean {
  const trimmed = markdown.trim();

  if (trimmed.length < 120) {
    return REDIRECT_STUB_MARKERS.some((pattern) => pattern.test(trimmed));
  }

  return false;
}

function readRepoMarkdown(relativePath: string): string {
  const repoRoot = path.resolve(process.cwd(), "..");
  const fullPath = path.join(repoRoot, relativePath.replace(/^\//, ""));

  return readFileSync(fullPath, "utf8");
}

function assertNotRedirectStub(entry: ProductDocumentationEntry): void {
  const primary = entry.sourcePaths[0];

  if (primary === undefined) {
    return;
  }

  const markdown = readRepoMarkdown(primary);

  expect(isRedirectStubMarkdown(markdown), `${entry.slug} primary source must not be a redirect stub`).toBe(false);
}

describe("product-documentation-registry", () => {
  it("maps canonical slugs to in-app routes", () => {
    expect(inAppHelpHref("review-guide")).toBe("/help/review-guide");
    expect(inAppHelpHref("pilot-guide")).toBe("/help/pilot-guide");
    expect(getProductDocumentationEntry("troubleshooting")?.title).toBe("Troubleshooting");
    expect(getProductDocumentationEntry("starting-reviews")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("starting-reviews")).toBeNull();
    expect(inAppHelpHref("starting-reviews")).toBe("/help/starting-reviews");
    expect(getProductDocumentationEntry("creating-runs")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBeNull();
    expect(inAppHelpHref("creating-runs")).toBe("/help/creating-runs");
    expect(getProductDocumentationEntry("data-handling-tenant-isolation")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("data-handling-tenant-isolation")).toBeNull();
    expect(inAppHelpHref("data-handling-tenant-isolation")).toBe("/help/data-handling-tenant-isolation");
    expect(getProductDocumentationEntry("integrations/azure-boards")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("integrations/azure-boards")).toBeNull();
    expect(inAppHelpHref("integrations/azure-boards")).toBe("/help/integrations/azure-boards");
    expect(getProductDocumentationEntry("evidence-only-review")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("evidence-only-review")).toBeNull();
    expect(inAppHelpHref("evidence-only-review")).toBe("/help/evidence-only-review");
    expect(inAppHelpHref("evidence-only-review", "fast-path-evidence-only")).toBe(
      "/help/evidence-only-review#fast-path-evidence-only",
    );
    const firstArchitectureReview = getProductDocumentationEntry("first-architecture-review");
    expect(firstArchitectureReview?.includeIntroWithSections).not.toBe(true);
    expect(getProductDocumentationEntry("pilot-roi-model")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("pilot-roi-model")).toBeNull();
    expect(inAppHelpHref("pilot-roi-model")).toBe("/help/pilot-roi-model");
    expect(getProductDocumentationEntry("cloud-connections/azure")?.title).toBe("Connect Azure securely");
    expect(getProductDocumentationEntry("cloud-connections/aws")?.title).toBe("Connect AWS securely");
    expect(getProductDocumentationEntry("cloud-connections/gcp")?.title).toBe("Connect GCP securely");
    expect(getProductDocumentationEntry("enterprise-onboarding")?.title).toBe(
      ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE,
    );
    expect(inAppHelpHref("enterprise-onboarding")).toBe("/help/enterprise-onboarding");
    expect(inAppHelpHref("cloud-connections-azure")).toBe("/help/cloud-connections/azure");
    expect(inAppHelpHref("cloud-connections-aws")).toBe("/help/cloud-connections/aws");
    expect(inAppHelpHref("cloud-connections-gcp")).toBe("/help/cloud-connections/gcp");
    expect(getProductDocumentationEntry("core-pilot")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("core-pilot")).toBeNull();
    expect(inAppHelpHref("core-pilot")).toBe("/help/core-pilot");
    expect(getProductDocumentationEntry("product-overview")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("product-overview")).toBeNull();
    expect(inAppHelpHref("product-overview")).toBe("/help/product-overview");
    expect(getProductDocumentationEntry("how-it-works")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("how-it-works")).toBeNull();
    expect(inAppHelpHref("how-it-works")).toBe("/help/how-it-works");
  });

  it("loads markdown for every registry topic from the monorepo", () => {
    for (const entry of listProductDocumentationEntries()) {
      const loaded = tryLoadProductDocumentation(entry.slug);

      expect(loaded, `missing markdown for ${entry.slug}`).not.toBeNull();

      if (entry.sourcePaths.length === 0) {
        expect(loaded!.markdown, `${entry.slug} app-rendered topics use empty markdown`).toBe("");
        continue;
      }

      expect(loaded!.markdown.trim().length).toBeGreaterThan(40);
    }
  });

  it("registers glossary as app-rendered (no markdown source)", () => {
    const glossary = getProductDocumentationEntry("glossary");

    expect(glossary?.sourcePaths).toEqual([]);
    expect(glossary?.pdfStatus).toBeNull();
    expect(glossary?.lastReviewed).toBe(CUSTOMER_GLOSSARY_CONTRACT_VERSION);
    expect(glossary?.releaseApplicability).toContain("product vocabulary");
    expect(tryLoadProductDocumentation("glossary")?.markdown).toBe("");
  });

  it("registers troubleshooting as app-rendered (no markdown source)", () => {
    const troubleshooting = getProductDocumentationEntry("troubleshooting");

    expect(troubleshooting?.sourcePaths).toEqual([]);
    expect(troubleshooting?.pdfStatus).toBeNull();
    expect(tryLoadProductDocumentation("troubleshooting")?.markdown).toBe("");
  });

  it("registers integration readiness help for contextual page guidance", () => {
    expect(getProductDocumentationEntry("integration-readiness")?.title).toBe("Integration readiness");
  });

  it("keeps AWS and GCP cloud-connection help free of Azure-only copy and AWS banned jargon", () => {
    const awsLoaded = tryLoadProductDocumentation("cloud-connections-aws");
    const gcpLoaded = tryLoadProductDocumentation("cloud-connections-gcp");

    expect(awsLoaded).not.toBeNull();
    expect(gcpLoaded).not.toBeNull();

    const awsMarkdown = awsLoaded!.markdown;
    const gcpMarkdown = gcpLoaded!.markdown;

    expect(awsMarkdown).toContain("Connect AWS securely");
    expect(awsMarkdown).not.toContain("Cost Management Reader");
    expect(awsMarkdown).not.toContain("connect-azure-securely");
    expect(awsMarkdown).not.toContain("Evidence tier");
    expect(awsMarkdown).not.toContain("hosted pull");
    expect(awsMarkdown).not.toContain("Get-ArchLucidAwsPackage.ps1");

    expect(gcpMarkdown).toContain("Connect GCP securely");
    expect(gcpMarkdown).not.toContain("Cost Management Reader");
    expect(gcpMarkdown).not.toContain("connect-azure-securely");
  });

  it("does not register redirect-only stub paths for buyer or operator audiences (TB-146)", () => {
    for (const entry of listProductDocumentationEntries()) {
      if (entry.audience === "developer") {
        continue;
      }

      assertNotRedirectStub(entry);
    }
  });

  it("declares pdfStatus on every registry entry with null default (TB-722)", () => {
    for (const entry of listProductDocumentationEntries()) {
      expect(entry).toHaveProperty("pdfStatus");
      expect(entry.pdfStatus === null || typeof entry.pdfStatus === "string").toBe(true);
    }
  });

  it("keeps pdfStatus internal entries aligned with help-center internal tier (TB-722)", () => {
    for (const entry of listProductDocumentationEntries()) {
      if (entry.pdfStatus !== "internal") {
        continue;
      }

      expect(getHelpCenterTier(entry)).toBe("internal");
    }
  });

  it("does not mark internal-tier help topics as public PDFs (TB-722)", () => {
    for (const entry of listProductDocumentationEntries()) {
      if (entry.pdfStatus !== "public") {
        continue;
      }

      expect(getHelpCenterTier(entry)).not.toBe("internal");
    }
  });

  it("does not register contributor-only pre-commit CI runbook in the in-app registry (TB-735)", () => {
    expect(getProductDocumentationEntry("pre-commit-ci-gate")).toBeNull();
  });

  it("maps initial PDF strategy slugs to expected pdfStatus (TB-722)", () => {
    const expected: Readonly<Record<string, ProductDocumentationEntry["pdfStatus"]>> = {
      "first-architecture-review": "public",
      "getting-started": "public",
      "data-handling": "public",
      "security-trust": "public",
      "sponsor-report": "public",
      "cloud-connections-azure": "customer",
      "cloud-connections-aws": "customer",
      "cloud-connections-gcp": "customer",
      "azure-permissions": "customer",
      "governance-approval": "customer",
      "policy-packs": "customer",
      "audit-trail": "customer",
    };

    for (const [slug, pdfStatus] of Object.entries(expected)) {
      expect(getProductDocumentationEntry(slug)?.pdfStatus).toBe(pdfStatus);
    }
  });

  it("declares contentKind on every registry entry (TB-732)", () => {
    const registrySlugs = listProductDocumentationEntries().map((entry) => entry.slug);

    expect(registrySlugs.length).toBeGreaterThan(0);

    for (const entry of listProductDocumentationEntries()) {
      expect(entry).toHaveProperty("contentKind");
      expect(
        entry.contentKind === "product-help" ||
          entry.contentKind === "technical-documentation" ||
          entry.contentKind === "internal-runbook",
      ).toBe(true);
      expect(entry.contentKind).toBe(PRODUCT_DOCUMENTATION_CONTENT_KIND_BY_SLUG[entry.slug]);
    }

    for (const slug of Object.keys(PRODUCT_DOCUMENTATION_CONTENT_KIND_BY_SLUG)) {
      expect(registrySlugs, `orphan contentKind mapping for ${slug}`).toContain(slug);
    }
  });

  it("tags internal-runbook slugs with internal-runbook contentKind (TB-732 / TB-1250 / TB-1329)", () => {
    const internalRunbookSlugs = [
      "pilot-feedback",
      "engineering-troubleshooting",
      "cli-usage",
      "api-contracts",
      "configuration-reference",
    ] as const;

    for (const slug of internalRunbookSlugs) {
      expect(isInternalRunbookSlug(slug)).toBe(true);
      expect(getProductDocumentationEntry(slug)?.contentKind).toBe("internal-runbook");
    }
  });

  it("tags technical-documentation slugs per IA foundation (TB-732 / TB-1250)", () => {
    const technicalSlugs: readonly string[] = [];

    for (const slug of technicalSlugs) {
      const kind: ProductDocumentationContentKind | undefined =
        getProductDocumentationEntry(slug)?.contentKind;

      expect(kind, slug).toBe("technical-documentation");
    }
  });

  it("keeps evidence-intake and review-packages on distinct help sources (TB-761)", () => {
    const evidenceIntake = getProductDocumentationEntry("evidence-intake");
    const reviewPackages = getProductDocumentationEntry("review-packages");

    expect(evidenceIntake?.sourcePaths).toEqual([
      "docs/library/customer-facing/EVIDENCE_INTAKE_OPERATOR_GUIDE.md",
    ]);
    expect(reviewPackages?.sourcePaths).toEqual([
      "docs/library/customer-facing/REVIEW_PACKAGES_OPERATOR_GUIDE.md",
    ]);
    expect(evidenceIntake?.sourcePaths[0]).not.toBe(reviewPackages?.sourcePaths[0]);

    const evidenceMarkdown = tryLoadProductDocumentation("evidence-intake")?.markdown ?? "";
    const packagesMarkdown = tryLoadProductDocumentation("review-packages")?.markdown ?? "";

    expect(evidenceMarkdown).toContain("Choose a starting path");
    expect(evidenceMarkdown).not.toContain("Workflow recipes by persona");
    expect(packagesMarkdown).toContain("Where to find your packages");
    expect(packagesMarkdown).not.toContain("Workflow recipes by persona");
    expect(evidenceMarkdown).not.toBe(packagesMarkdown);
  });

  it("serves evidence-trail from dedicated operator guide, not concepts primer (TB-762)", () => {
    const evidenceTrail = getProductDocumentationEntry("evidence-trail");
    const gettingStarted = getProductDocumentationEntry("getting-started");

    expect(evidenceTrail?.sourcePaths).toEqual([
      "docs/library/customer-facing/EVIDENCE_TRAIL_OPERATOR_GUIDE.md",
    ]);
    expect(gettingStarted?.sourcePaths).toEqual([
      "docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md",
    ]);
    expect(evidenceTrail?.sourcePaths[0]).not.toBe(gettingStarted?.sourcePaths[0]);

    const trailMarkdown = tryLoadProductDocumentation("evidence-trail")?.markdown ?? "";
    const conceptsMarkdown = tryLoadProductDocumentation("getting-started")?.markdown ?? "";

    expect(trailMarkdown).toContain("Trace table vs graph view");
    expect(trailMarkdown).toContain("Evidence provenance");
    expect(trailMarkdown).not.toContain("Plain-language vocabulary");
    expect(conceptsMarkdown).toContain("Plain-language vocabulary");
    expect(trailMarkdown).not.toBe(conceptsMarkdown);
  });

  it("loads TB-727 sectionAnchor registry entries from existing markdown only", () => {
    const SponsorReport = tryLoadProductDocumentation("sponsor-report");
    const firstArchitectureReview = tryLoadProductDocumentation("first-architecture-review");
    const dataHandling = tryLoadProductDocumentation("data-handling");

    // TB-1739 / Batch A: product-overview retired — sponsor-report owns SPONSOR_SPONSOR_BRIEF.md sections.
    expect(SponsorReport?.entry.slug).toBe("sponsor-report");
    expect(SponsorReport?.markdown).toContain("What Pilot proves");
    expect(SponsorReport?.markdown).toContain("What ArchLucid is");
    expect(SponsorReport?.markdown).toContain("Manual review vs ArchLucid proof package");

    expect(firstArchitectureReview?.entry.slug).toBe("first-architecture-review");
    expect(firstArchitectureReview?.markdown).toContain("evidence-only review");
    expect(firstArchitectureReview?.markdown).toContain("What can wait");

    expect(dataHandling?.markdown).toContain("What stays in your tenant");
    expect(dataHandling?.markdown).toContain("Three layers");
    expect(dataHandling?.markdown).not.toContain("Verification pack");
  });

  it("declares provenance metadata on comparison-replay operator guide (CO)", () => {
    const entry = getProductDocumentationEntry("comparison-replay");

    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toContain("Compare two reviews");
  });

  it("declares provenance metadata on enterprise-onboarding operator checklist (HE)", () => {
    const entry = getProductDocumentationEntry("enterprise-onboarding");

    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toContain("hosted enterprise tenant onboarding");
    expect(entry?.pdfStatus).toBe("customer");
  });

  it("declares provenance metadata on evidence-intake operator guide (EVI)", () => {
    const entry = getProductDocumentationEntry("evidence-intake");

    expect(entry?.lastReviewed).toBe("2026-08-10");
    expect(entry?.releaseApplicability).toContain("evidence intake");
    expect(entry?.pdfStatus).toBe("customer");
  });

  it("declares provenance metadata on policy-packs operator guide (HEO)", () => {
    const entry = getProductDocumentationEntry("policy-packs");

    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toContain("policy pack assignment and conflict resolution");
    expect(entry?.pdfStatus).toBe("customer");
  });

  it("declares provenance metadata on api-contracts internal runbook (HG)", () => {
    const entry = getProductDocumentationEntry("api-contracts");

    expect(entry?.lastReviewed).toBe("2026-08-10");
    expect(entry?.releaseApplicability).toContain("HTTP contract");
  });

  it("keeps internal-runbook topics with source paths off the missing-provenance list (HG)", () => {
    const missingProvenance = listProductDocumentationEntries()
      .filter((entry) => entry.contentKind === "internal-runbook" && entry.sourcePaths.length > 0)
      .filter((entry) => entry.lastReviewed === undefined || entry.releaseApplicability === undefined)
      .map((entry) => entry.slug)
      .sort();

    expect(missingProvenance).not.toContain("api-contracts");
  });

  it("keeps operator and buyer topics with governance citations off the missing-provenance list (CO)", () => {
    const missingProvenance = listProductDocumentationEntries()
      .filter(
        (entry) =>
          (entry.audience === "operator" || entry.audience === "buyer") && entry.sourcePaths.length > 0,
      )
      .filter((entry) => entry.lastReviewed === undefined || entry.releaseApplicability === undefined)
      .map((entry) => entry.slug)
      .sort();

    expect(missingProvenance).not.toContain("comparison-replay");
    expect(missingProvenance).not.toContain("enterprise-onboarding");
    expect(missingProvenance).not.toContain("evidence-intake");
    expect(missingProvenance).not.toContain("policy-packs");
  });
});
