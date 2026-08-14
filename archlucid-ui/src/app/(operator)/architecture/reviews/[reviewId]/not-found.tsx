import { OperatorBrandedNotFound } from "@/components/operator/OperatorBrandedNotFound";

/** Review detail not-found — stale or unknown review id. */
export default function ReviewDetailNotFound() {
  return (
    <div className="w-full max-w-[1200px] px-1 py-6 sm:px-0">
      <OperatorBrandedNotFound showProcessingHint retryLabel="Refresh" variant="review" />
    </div>
  );
}
