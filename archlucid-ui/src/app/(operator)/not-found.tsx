import { OperatorBrandedNotFound } from "@/components/operator/OperatorBrandedNotFound";

/** Operator-shelled Not Found (invalid deep links, stale ids, malformed route tokens). */
export default function OperatorNotFound() {
  return (
    <div className="w-full max-w-[1200px] px-1 py-6 sm:px-0">
      <OperatorBrandedNotFound showProcessingHint />
    </div>
  );
}
