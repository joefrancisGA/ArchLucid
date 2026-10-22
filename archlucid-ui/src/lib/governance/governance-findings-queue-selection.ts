import type { ReadonlyURLSearchParams } from "next/navigation";

const FOCUSED_FINDING_PARAM = "focusedFinding";

export function readGovernanceQueueFocusedFindingId(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): string | null {
  const value = searchParams.get(FOCUSED_FINDING_PARAM)?.trim() ?? "";

  return value.length > 0 ? value : null;
}

export function writeGovernanceQueueFocusedFindingId(findingId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (findingId === null || findingId.trim().length === 0) {
    url.searchParams.delete(FOCUSED_FINDING_PARAM);
  }
  else {
    url.searchParams.set(FOCUSED_FINDING_PARAM, findingId);
  }

  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
