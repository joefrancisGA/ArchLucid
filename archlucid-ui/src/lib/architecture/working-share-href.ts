import {
  architectureIdentityPath,
  architectureNestedFindingsPath,
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

function appendSearchParams(
  params: URLSearchParams,
  search: WorkingShareHrefInput["search"],
  options?: { readonly omitReviewTab?: boolean },
): void {
  if (search === null || search === undefined) {
    return;
  }

  if (search instanceof URLSearchParams) {
    search.forEach((value, key) => {
      if (options?.omitReviewTab === true && key === "reviewTab") {
        return;
      }

      params.set(key, value);
    });

    return;
  }

  if (typeof search === "string") {
    const trimmed = search.trim().replace(/^\?/, "");

    if (trimmed.length === 0) {
      return;
    }

    const parsed = new URLSearchParams(trimmed);
    parsed.forEach((value, key) => {
      if (options?.omitReviewTab === true && key === "reviewTab") {
        return;
      }

      params.set(key, value);
    });

    return;
  }

  for (const [key, value] of Object.entries(search)) {
    if (options?.omitReviewTab === true && key === "reviewTab") {
      continue;
    }

    params.set(key, value);
  }
}

function serializeSearchParams(params: URLSearchParams): string {
  const serialized = params.toString();

  return serialized.length > 0 ? `?${serialized}` : "";
}

function workingShareFindingsHref(
  architectureId: string,
  reviewId: string,
  search: WorkingShareHrefInput["search"],
): string {
  const params = new URLSearchParams();
  params.set("runId", reviewId);
  appendSearchParams(params, search, { omitReviewTab: true });

  return `${architectureNestedFindingsPath(architectureId)}${serializeSearchParams(params)}`;
}

/** Working clipboard/share URLs prefer the architecture afternoon document (AO-09 / IP-004). */
export function workingShareHref(input: WorkingShareHrefInput): WorkingShareHrefResult {
  const architectureId = input.architectureId?.trim() ?? "";
  const reviewId = input.reviewId?.trim() ?? "";
  const searchSuffix = serializeSearchParams(
    (() => {
      const params = new URLSearchParams();
      appendSearchParams(params, input.search);

      return params;
    })(),
  );

  if (architectureId.length > 0 && reviewId.length > 0) {
    return {
      href: workingShareFindingsHref(architectureId, reviewId, input.search),
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
