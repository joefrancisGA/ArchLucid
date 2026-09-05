import { readReviewRunIdFromPathname } from "@/lib/compare-two-reviews-route";

export type ResolveOpenPackageRunIdInput = {
  readonly pathname: string | null | undefined;
  readonly lastOpenReviewId?: string | null;
};

/** Working insights tools: path-scoped review wins; else last-open package (LS-05 / IS-13). */
export function resolveOpenPackageRunId(input: ResolveOpenPackageRunIdInput): string | null {
  const fromPath = readReviewRunIdFromPathname(input.pathname ?? "");

  if (fromPath !== null) {
    return fromPath;
  }

  const lastOpen = input.lastOpenReviewId?.trim() ?? "";

  if (lastOpen.length === 0) {
    return null;
  }

  return lastOpen;
}
