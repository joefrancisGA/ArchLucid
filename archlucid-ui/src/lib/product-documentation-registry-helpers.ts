/**
 * Slug and href helpers for the product documentation registry.
 */
import {
  cloudConnectionsHelpPathSegmentForRegistrySlug,
  normalizeCloudConnectionsSlashHelpTopicSlug,
} from "@/lib/cloud-connections-help-routes";
import { resolveProductDocumentationContentKind } from "@/lib/product-documentation-content-kinds";

import { PRODUCT_DOCUMENTATION_REGISTRY_INPUT } from "./product-documentation-registry-entries";
import type { ProductDocumentationEntry } from "./product-documentation-registry-types";

export const PRODUCT_DOCUMENTATION_REGISTRY: readonly ProductDocumentationEntry[] =
  PRODUCT_DOCUMENTATION_REGISTRY_INPUT.map((entry) => ({
    ...entry,
    contentKind: resolveProductDocumentationContentKind(entry.slug),
    pdfStatus: entry.pdfStatus ?? null,
  }));

const bySlug = new Map(PRODUCT_DOCUMENTATION_REGISTRY.map((entry) => [entry.slug, entry]));

export function normalizeHelpTopicSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length === 0) {
    return trimmed;
  }

  const cloudRegistrySlug = normalizeCloudConnectionsSlashHelpTopicSlug(trimmed);

  if (cloudRegistrySlug !== null) {
    return cloudRegistrySlug;
  }

  return trimmed;
}


function preferredHelpPathSegmentForSlug(slug: string): string {
  const normalized = normalizeHelpTopicSlug(slug);
  const slashSegment = cloudConnectionsHelpPathSegmentForRegistrySlug(normalized);

  if (slashSegment !== null) {
    return slashSegment;
  }

  return normalized;
}


export function inAppHelpHref(slug: string, hashFragment?: string): string {
  const trimmed = slug.trim().toLowerCase();
  const base = `/help/${preferredHelpPathSegmentForSlug(trimmed).trim().toLowerCase()}`;
  const hash = hashFragment?.trim().replace(/^#/, "");

  if (hash === undefined || hash.length === 0) {
    return base;
  }

  return `${base}#${hash}`;
}


export function getProductDocumentationEntry(slug: string): ProductDocumentationEntry | null {
  const normalized = normalizeHelpTopicSlug(slug);

  if (normalized.length === 0) {
    return null;
  }

  return bySlug.get(normalized) ?? null;
}

export function listProductDocumentationEntries(): readonly ProductDocumentationEntry[] {
  return PRODUCT_DOCUMENTATION_REGISTRY;
}
