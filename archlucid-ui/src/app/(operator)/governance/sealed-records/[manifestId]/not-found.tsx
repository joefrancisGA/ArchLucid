import { cn } from "@/lib/utils";
import Link from "next/link";

import { OperatorBrandedNotFound } from "@/components/operator/OperatorBrandedNotFound";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Signed manifest not-found — stale or unknown manifest id. */
export default function ManifestDetailNotFound() {
  return (
    <OperatorPageContainer variant="dashboard" className="px-1 py-6 sm:px-0">
      <OperatorBrandedNotFound showProcessingHint />
      <p className={cn("mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Open a finalized review from{" "}
        <Link href="/architecture/reviews" className={OPERATOR_LINK.nav}>
          reviews
        </Link>{" "}
        to reach its Finalized review record.
      </p>
    </OperatorPageContainer>
  );
}
