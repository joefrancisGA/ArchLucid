import { SCIM_VERIFY_FAILED_GUIDANCE } from "@/lib/scim-provisioning-page-copy";

export type ScimVerifyFailureDetails = {
  readonly httpStatus?: number;
};

/** Customer-facing verification failure message — never includes response bodies or endpoint names. */
export function buildScimVerifyFailureMessage(): string {
  return SCIM_VERIFY_FAILED_GUIDANCE;
}

/** Retains only non-sensitive diagnostic fields for optional disclosure. */
export function buildScimVerifyFailureDetails(httpStatus: number): ScimVerifyFailureDetails {
  if (httpStatus > 0) {
    return { httpStatus };
  }

  return {};
}
