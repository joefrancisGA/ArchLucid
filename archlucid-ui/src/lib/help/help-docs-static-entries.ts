import type { DocIndexEntry } from "@/lib/help-docs-index";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { remapGovernanceOperatorHref } from "@/lib/product-line/securenow-compliance-routes";

/** Default reference links so Help always has content before /doc-index.json loads. */
const HELP_DOCS_STATIC_ENTRIES_ARCHITECTURE: readonly DocIndexEntry[] = [
  {
    title: "Choose your next step",
    summary: "Path chooser — evaluate, mid-pilot recovery, procurement, sponsor output, or engineering support.",
    category: "Getting Started",
    url: "/help/choose-your-next-step",
  },
  { title: "Home (pilot)", summary: "Pilot checklist and recent reviews.", category: "Getting Started", url: "/" },
  {
    title: "New architecture request",
    summary: "Start a guided architecture review request.",
    category: "Getting Started",
    url: "/architecture/reviews/new",
  },
  { title: "Reviews list", summary: "Browse reviews for the workspace.", category: "Operations", url: "/architecture/reviews" },
  {
    title: "Findings queue",
    summary: "Review findings across reviews and policy signals.",
    category: "Operations",
    url: "/governance/findings",
  },
  {
    title: "Policy packs",
    summary: "Declarative policy bundles for review.",
    category: "Security",
    url: "/governance/policy-packs",
  },
  {
    title: "Indexed search",
    summary: "Search reviews, findings, and related records where enabled.",
    category: "Operations",
    url: "/insights/search-review-evidence",
  },
  {
    title: "Troubleshooting",
    summary: "Symptom-first architect triage for Home, reviews, exports, and permissions.",
    category: "Operations",
    url: "/help/troubleshooting",
  },
  {
    title: "Admin diagnostics",
    summary: "System status, readiness rows, and observability signals.",
    category: "Operations",
    url: "/help/admin-diagnostics",
  },
];

export function resolveHelpDocsStaticEntries(productLine: ProductLineId): readonly DocIndexEntry[] {
  if (productLine === "architecture") {
    return HELP_DOCS_STATIC_ENTRIES_ARCHITECTURE;
  }

  return HELP_DOCS_STATIC_ENTRIES_ARCHITECTURE.map((entry) => {
    const url = remapGovernanceOperatorHref(entry.url, productLine);

    if (entry.title === "Findings queue" && productLine === "security") {
      return {
        ...entry,
        url,
        summary: "Triage inventory-backed findings from ARC-AMPE policy packs in this workspace.",
      };
    }

    return { ...entry, url };
  });
}
