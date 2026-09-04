/** RFC 9457 Problem Details parsing surface (barrel). */

export type { ApiProblemDetails, ApiValidationFieldError } from "@/lib/api-problem-extensions";

export { readExtensions, readOptionalNumber, readStringArray, readTrimmedString } from "@/lib/api-problem-extensions";

export { readProblemDetailFromBody, tryParseApiProblemDetails } from "@/lib/api-problem-parse";
