import { extractReviewIdFromPathname } from "@/lib/desk-continuity-preference";

export type ResolveOpenPackageRunIdInput = {
  readonly pathname: string | null | undefined;
  readonly lastOpenReviewId?: string | null;
};

/** Working insights tools: path-scoped review wins; else last-open package (LS-05 / AO-30). */
export function resolveOpenPackageRunId(input: ResolveOpenPackageRunIdInput): string | null {
  const fromPath = extractReviewIdFromPathname(input.pathname ?? "");

  if (fromPath !== null) {
    return fromPath;
  }

  const lastOpen = input.lastOpenReviewId?.trim() ?? "";

  if (lastOpen.length === 0) {
    return null;
  }

  return lastOpen;
}
