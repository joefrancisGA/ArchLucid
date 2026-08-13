/**
 * Buyer-facing copy for the shared operator branded 404 surface (`OperatorBrandedNotFound`).
 * Keep HTTP "404" out of visible chrome — screen readers still get "Page not found".
 */

export type BrandedNotFoundVariant = "generic" | "review";

export const BRANDED_NOT_FOUND_GENERIC_TITLE = "Not found in this workspace";

export const BRANDED_NOT_FOUND_GENERIC_BODY =
  "The link may be mistyped, expired, or pointed at a review, evidence item, finding, or workspace item that is not available here.";

export const BRANDED_NOT_FOUND_REVIEW_TITLE = "This review isn't available";

export const BRANDED_NOT_FOUND_REVIEW_BODY =
  "It may have been removed, belong to another workspace, or the link may be incomplete.";

export const BRANDED_NOT_FOUND_RETRY_HINT =
  "If the review was just created, wait a moment and retry. If you pasted an ID, confirm the full value was copied.";

export const BRANDED_NOT_FOUND_WORKSPACE_HINT =
  "If you expected a completed review, open Reviews and confirm the workspace selector is set correctly.";

export function brandedNotFoundTitle(variant: BrandedNotFoundVariant): string {
  if (variant === "review")
    return BRANDED_NOT_FOUND_REVIEW_TITLE;

  return BRANDED_NOT_FOUND_GENERIC_TITLE;
}

export function brandedNotFoundBody(variant: BrandedNotFoundVariant): string {
  if (variant === "review")
    return BRANDED_NOT_FOUND_REVIEW_BODY;

  return BRANDED_NOT_FOUND_GENERIC_BODY;
}
