import { OperatorBrandedNotFound } from "@/components/operator/OperatorBrandedNotFound";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { cn } from "@/lib/utils";

/** Review detail not-found — stale or unknown review id. */
export default function ReviewDetailNotFound() {
  return (
    <OperatorPageContainer variant="dashboard" className={cn("px-1 py-6 sm:px-0")}>
      <OperatorBrandedNotFound showProcessingHint retryLabel="Refresh" variant="review" />
    </OperatorPageContainer>
  );
}
