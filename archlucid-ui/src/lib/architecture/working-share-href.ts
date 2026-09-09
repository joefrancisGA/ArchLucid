import {
  architectureIdentityPath,
  architectureNestedReviewPath,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";

export type WorkingShareHrefInput = {
  readonly architectureId?: string | null;
  readonly reviewId?: string | null;
  readonly search?: string | Record<string, string> | URLSearchParams | null;
};

export type WorkingShareHrefResult = {
  readonly href: string;
  readonly isUnlinkedJob: boolean;
};

export const WORKING_SHARE_UNLINKED_JOB_TOAST =
  "Link copied. This review is not linked to an architecture desk yet.";

function normalizeSearch(search: WorkingShareHrefInput["search"]): string {
  if (search === null || search === undefined) {
    return "";
  }

  if (search instanceof URLSearchParams) {
    const serialized = search.toString();

    return serialized.length > 0 ? `?${serialized}` : "";
  }

  if (typeof search === "string") {
    const trimmed = search.trim();

    if (trimmed.length === 0) {
      return "";
    }

    return trimmed.startsWith("?") ? trimmed : `?${trimmed}`;
  }

  const params = new URLSearchParams(search);
  const serialized = params.toString();

  return serialized.length > 0 ? `?${serialized}` : "";
}

/** Working clipboard/share URLs prefer the architecture locator (AO-09). */
export function workingShareHref(input: WorkingShareHrefInput): WorkingShareHrefResult {
  const architectureId = input.architectureId?.trim() ?? "";
  const reviewId = input.reviewId?.trim() ?? "";
  const searchSuffix = normalizeSearch(input.search);

  if (architectureId.length > 0 && reviewId.length > 0) {
    return {
      href: `${architectureNestedReviewPath(architectureId, reviewId)}${searchSuffix}`,
      isUnlinkedJob: false,
    };
  }

  if (architectureId.length > 0) {
    return {
      href: `${architectureIdentityPath(architectureId)}${searchSuffix}`,
      isUnlinkedJob: false,
    };
  }

  if (reviewId.length > 0) {
    return {
      href: `${reviewDetailPath(reviewId)}${searchSuffix}`,
      isUnlinkedJob: true,
    };
  }

  return {
    href: "/",
    isUnlinkedJob: true,
  };
}
