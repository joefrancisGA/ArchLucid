import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNUP_VERIFY_LOADING_STATUS } from "@/lib/marketing/signup-verify-page-copy";
import { cn } from "@/lib/utils";

/** Loading placeholder while signup verify search params hydrate (SVX). */
export function SignupVerifyLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className={cn(MARKETING_SURFACES.cardComfort, "mx-auto w-full max-w-md shadow-sm space-y-4")}
      data-testid="signup-verify-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={SIGNUP_VERIFY_LOADING_STATUS}
    >
      <p className={cn("m-0 text-center text-al-text-secondary sm:text-left", MARKETING_TYPOGRAPHY.body)}>
        {SIGNUP_VERIFY_LOADING_STATUS}
      </p>
      <div className="h-10 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-10 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
