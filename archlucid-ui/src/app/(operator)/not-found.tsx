import { OperatorBrandedNotFound } from "@/components/operator/OperatorBrandedNotFound";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";

/** Operator-shelled Not Found (invalid deep links, stale ids, malformed route tokens). */
export default function OperatorNotFound() {
  return (
    <OperatorPageContainer variant="workflow" className="px-1 py-6 sm:px-0">
      <OperatorBrandedNotFound showProcessingHint />
    </OperatorPageContainer>
  );
}
