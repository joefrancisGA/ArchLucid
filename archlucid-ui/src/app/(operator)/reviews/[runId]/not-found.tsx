import Link from "next/link";

import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Review detail not-found — stale or unknown review id. */
export default function ReviewDetailNotFound() {
  return (
    <div className="w-full max-w-[1200px] px-1 py-6 sm:px-0">
      <OperatorBrandedNotFound showProcessingHint retryLabel="Refresh" />
      <p className={cn("mt-4", OPERATOR_TYPOGRAPHY.helper)}>
        Return to your{" "}
        <Link href="/reviews?projectId=default" className={OPERATOR_LINK.nav}>
          review packages list
        </Link>{" "}
        to pick an active architecture review.
      </p>
    </div>
  );
}
