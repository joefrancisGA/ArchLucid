import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

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
    expect(getProductDocumentationEntry("cloud-connections/azure")?.title).toBe("Connect Azure securely");
    expect(getProductDocumentationEntry("cloud-connections/aws")?.title).toBe("Connect AWS securely");
    expect(getProductDocumentationEntry("cloud-connections/gcp")?.title).toBe("Connect GCP securely");
    expect(getProductDocumentationEntry("enterprise-onboarding")?.title).toBe("Enterprise onboarding checklist");
    expect(inAppHelpHref("enterprise-onboarding")).toBe("/help/enterprise-onboarding");
  });

  it("loads markdown for every registry topic from the monorepo", () => {
    for (const entry of listProductDocumentationEntries()) {
      const loaded = tryLoadProductDocumentation(entry.slug);

      expect(loaded, `missing markdown for ${entry.slug}`).not.toBeNull();
      expect(loaded!.markdown.trim().length).toBeGreaterThan(40);
    }
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

  it("maps initial PDF strategy slugs to expected pdfStatus (TB-722)", () => {
    const expected: Readonly<Record<string, ProductDocumentationEntry["pdfStatus"]>> = {
      "core-pilot": "public",
      "first-hour-operator-path": "public",
      "how-it-works": "public",
      "data-handling": "public",
      "security-trust": "public",
      "cloud-connections-azure": "customer",
      "cloud-connections-aws": "customer",
      "cloud-connections-gcp": "customer",
      "governance-approval": "customer",
      "audit-trail": "customer",
      "pilot-roi-model": null,
    };

    for (const [slug, pdfStatus] of Object.entries(expected)) {
      expect(getProductDocumentationEntry(slug)?.pdfStatus).toBe(pdfStatus);
    }
  });
});
