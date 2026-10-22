import { RunDetailSkeleton } from "@/components/skeletons/RunDetailSkeleton";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { cn } from "@/lib/utils";

/** Next.js loading UI while the server run detail page fetches run, manifest, artifacts, and explanation. */
export default function RunDetailLoading() {
  return (
    <OperatorPageContainer variant="dashboard" className={cn("px-1 py-4 sm:px-0")}>
      <RunDetailSkeleton />
    </OperatorPageContainer>
  );
}
