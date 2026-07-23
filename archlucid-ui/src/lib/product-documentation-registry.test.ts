import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  isInternalRunbookSlug,
  PRODUCT_DOCUMENTATION_CONTENT_KIND_BY_SLUG,
  type ProductDocumentationContentKind,
} from "@/lib/product-documentation-content-kinds";
import {
  getProductDocumentationEntry,
  inAppHelpHref,
  listProductDocumentationEntries,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";
import { getHelpCenterTier } from "@/lib/help-center-catalog";
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
    expect(getProductDocumentationEntry("starting-reviews")?.title).toBe("Starting architecture reviews");
    expect(getProductDocumentationEntry("creating-runs")?.slug).toBe("starting-reviews");
    expect(inAppHelpHref("starting-reviews")).toBe("/help/starting-reviews");
    expect(getProductDocumentationEntry("cloud-connections/azure")?.title).toBe("Connect Azure securely");
    expect(getProductDocumentationEntry("cloud-connections/aws")?.title).toBe("Connect AWS securely");
    expect(getProductDocumentationEntry("cloud-connections/gcp")?.title).toBe("Connect GCP securely");
    expect(getProductDocumentationEntry("enterprise-onboarding")?.title).toBe("Enterprise onboarding checklist");
    expect(inAppHelpHref("enterprise-onboarding")).toBe("/help/enterprise-onboarding");
    expect(inAppHelpHref("cloud-connections-azure")).toBe("/help/cloud-connections/azure");
    expect(inAppHelpHref("cloud-connections-aws")).toBe("/help/cloud-connections/aws");
    expect(inAppHelpHref("cloud-connections-gcp")).toBe("/help/cloud-connections/gcp");
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
    expect(tryLoadProductDocumentation("glossary")?.markdown).toBe("");
  });

  it("registers integration readiness help for contextual page guidance", () => {
    expect(getProductDocumentationEntry("integration-readiness")?.title).toBe("Integration readiness");
  });

  it("keeps AWS and GCP cloud-connection help free of Azure-only copy", () => {
    const awsLoaded = tryLoadProductDocumentation("cloud-connections-aws");
    const gcpLoaded = tryLoadProductDocumentation("cloud-connections-gcp");

    expect(awsLoaded).not.toBeNull();
    expect(gcpLoaded).not.toBeNull();

    const awsMarkdown = awsLoaded!.markdown;
    const gcpMarkdown = gcpLoaded!.markdown;

    expect(awsMarkdown).toContain("Connect AWS securely");
    expect(awsMarkdown).not.toContain("Cost Management Reader");
    expect(awsMarkdown).not.toContain("connect-azure-securely");

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
      "core-pilot": "public",
      "first-hour-operator-path": "public",
      "how-it-works": "public",
      "data-handling": "public",
      "data-handling-tenant-isolation": "public",
      "security-trust": "public",
      "evidence-only-review": "public",
      "product-overview": "public",
      "cloud-connections-azure": "customer",
      "cloud-connections-aws": "customer",
      "cloud-connections-gcp": "customer",
      "azure-permissions": "customer",
      "governance-approval": "customer",
      "audit-trail": "customer",
      "pilot-roi-model": "public",
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

  it("tags internal-runbook slugs with internal-runbook contentKind (TB-732)", () => {
    const internalRunbookSlugs = [
      "first-value-20-minutes",
      "first-review",
      "policy-pack-delta-demo",
    ] as const;

    for (const slug of internalRunbookSlugs) {
      expect(isInternalRunbookSlug(slug)).toBe(true);
      expect(getProductDocumentationEntry(slug)?.contentKind).toBe("internal-runbook");
    }
  });

  it("tags technical-documentation slugs per IA foundation (TB-732)", () => {
    const technicalSlugs: readonly string[] = [
      "configuration-reference",
      "cli-usage",
      "governance-api-contracts",
      "admin-diagnostics",
      "developer-troubleshooting",
    ];

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
    const productOverview = tryLoadProductDocumentation("product-overview");
    const evidenceOnlyReview = tryLoadProductDocumentation("evidence-only-review");
    const dataHandlingIsolation = tryLoadProductDocumentation("data-handling-tenant-isolation");

    expect(productOverview?.markdown).toContain("What ArchLucid is");
    expect(productOverview?.markdown).toContain("Elevator Pitches");
    expect(productOverview?.markdown).not.toContain("What Pilot proves");

    expect(evidenceOnlyReview?.markdown).toContain("evidence-only review");
    expect(evidenceOnlyReview?.markdown).not.toContain("What can wait");

    expect(dataHandlingIsolation?.markdown).toContain("What stays in your tenant");
    expect(dataHandlingIsolation?.markdown).toContain("Three layers");
    expect(dataHandlingIsolation?.markdown).not.toContain("Verification pack");
  });
});
