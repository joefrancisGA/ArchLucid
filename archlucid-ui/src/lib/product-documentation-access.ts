import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { CurrentPrincipal } from "@/lib/current-principal";
import {
  getProductDocumentationEntry,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";

export function isInternalRunbookHelpTopic(entry: ProductDocumentationEntry): boolean {
  return entry.contentKind === "internal-runbook";
}

export function isInternalRunbookHelpSlug(slug: string): boolean {
  const entry = getProductDocumentationEntry(slug);

  if (entry === null) {
    return false;
  }

  return isInternalRunbookHelpTopic(entry);
}

/** Admin-only in-app `/help` topics (TB-735). */
export function callerCanAccessHelpTopic(
  entry: ProductDocumentationEntry,
  authorityRank: number,
): boolean {
  if (!isInternalRunbookHelpTopic(entry)) {
    return true;
  }

  return authorityRank >= AUTHORITY_RANK.AdminAuthority;
}

export function principalCanAccessHelpTopic(
  entry: ProductDocumentationEntry,
  principal: CurrentPrincipal,
): boolean {
  return callerCanAccessHelpTopic(entry, principal.authorityRank);
}
