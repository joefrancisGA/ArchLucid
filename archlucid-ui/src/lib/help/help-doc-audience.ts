import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import {
  getProductDocumentationEntry,
  PRODUCT_DOCUMENTATION_REGISTRY,
  type ProductDocumentationAudience,
} from "@/lib/product-documentation-registry";

function normalizeDocPath(docPath: string): string {
  const withoutHash = docPath.split("#")[0] ?? docPath;

  return withoutHash.replace(/^\//, "").trim().toLowerCase();
}

const audienceByDocPath = new Map<string, ProductDocumentationAudience>();

for (const entry of PRODUCT_DOCUMENTATION_REGISTRY) {
  for (const sourcePath of entry.sourcePaths) {
    const key = normalizeDocPath(sourcePath);

    if (!audienceByDocPath.has(key)) {
      audienceByDocPath.set(key, entry.audience);
    }
  }
}

/** Audiences included in default shell documentation search (no engineering runbooks). */
const DEFAULT_SEARCH_AUDIENCES: ReadonlySet<ProductDocumentationAudience> = new Set([
  "operator",
  "buyer",
  "marketing",
]);

/**
 * Resolves documentation audience for a repo-relative path from the product registry.
 * Unknown paths default to operator so curated index entries stay visible.
 */
function audienceFromHelpSlug(slug: string): ProductDocumentationAudience | "unknown" {
  const entry = getProductDocumentationEntry(slug);

  return entry?.audience ?? "unknown";
}

export function helpDocPathAudience(docPath: string): ProductDocumentationAudience | "unknown" {
  const key = normalizeDocPath(docPath);
  const direct = audienceByDocPath.get(key);

  if (direct !== undefined) {
    return direct;
  }

  const href = resolveInAppDocHref(docPath);
  const slug = href.replace(/^\/help\/?/, "").split("#")[0] ?? "";

  if (slug.length === 0 || slug === "help") {
    return "unknown";
  }

  return audienceFromHelpSlug(slug);
}

/** Whether a indexed doc path should appear in default operator documentation search. */
export function isHelpDocPathInDefaultOperatorSearch(docPath: string): boolean {
  const audience = helpDocPathAudience(docPath);

  if (audience === "unknown") {
    return true;
  }

  return DEFAULT_SEARCH_AUDIENCES.has(audience);
}
