import type { ReadonlyURLSearchParams } from "next/navigation";

import { appendMarketingAttributionToUrl } from "@/lib/marketing/append-marketing-attribution-to-url";

/**
 * Seeded Workspace A committed review run — {@code DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId}
 * ({@code ArchLucid.Core.Scoping}).
 */
export const DEFAULT_SELF_DEMO_PATH = "/runs/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf";

export function readSelfDemoTargetFromProcess(): string {
  const raw: string = (process.env.NEXT_PUBLIC_SELF_DEMO_URL ?? "").trim();

  if (raw !== "") return raw;

  return DEFAULT_SELF_DEMO_PATH;
}

export function buildSelfDemoCtaHref(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  pageOrigin: string,
  pathOrUrl: string = readSelfDemoTargetFromProcess(),
): string {
  return appendMarketingAttributionToUrl(pathOrUrl, searchParams, pageOrigin);
}
