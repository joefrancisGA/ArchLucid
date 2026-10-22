import { readPresenterModeFromSearchParams } from "@/lib/review-detail-workspace-tabs";

/** IH-055 — Working presenter quiet is density on the architecture, not a demo product route. */
export function resolveInhabitPresenterQuietOnWorking(input: {
  readonly workingMode: boolean;
  readonly presenterMode: boolean;
}): boolean {
  return input.workingMode && input.presenterMode;
}

export function readInhabitPresenterQuietFromSearch(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): boolean {
  return readPresenterModeFromSearchParams(searchParams);
}
