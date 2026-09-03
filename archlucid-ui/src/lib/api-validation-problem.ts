/** API validation Problem Details helpers (barrel). */

export type { ApiValidationFieldError } from "@/lib/api-problem-extensions";

export { sanitizeOperatorFacingText } from "@/lib/api-validation-problem-sanitize";

export {
  buildValidationProblemDisplayCopy,
  flattenValidationFieldErrors,
  formatValidationFailureSummary,
  formatValidationFieldKey,
  isGenericValidationTitle,
  isHttpRequestValidationFailure,
  parseAspNetValidationFieldErrors,
  type ValidationProblemDisplayCopy,
} from "@/lib/api-validation-problem-field-errors";
