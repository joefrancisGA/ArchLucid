import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { CurrentPrincipal } from "@/lib/current-principal";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import {
  getProductDocumentationEntry,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";

/** Host key catalog — internal operator shell only, not tenant Admin. */
const HOST_CONFIGURATION_HELP_SLUGS = new Set<string>(["configuration-reference"]);

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

export function isHostConfigurationHelpSlug(slug: string): boolean {
  return HOST_CONFIGURATION_HELP_SLUGS.has(slug);
}

/** Admin-only in-app `/help` topics (TB-735). Host configuration catalogs also require the internal operator shell. */
export function callerCanAccessHelpTopic(
  entry: ProductDocumentationEntry,
  authorityRank: number,
): boolean {
  if (isHostConfigurationHelpSlug(entry.slug)) {
    return isArchLucidInternalOperatorShellEnv() && authorityRank >= AUTHORITY_RANK.AdminAuthority;
  }

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
