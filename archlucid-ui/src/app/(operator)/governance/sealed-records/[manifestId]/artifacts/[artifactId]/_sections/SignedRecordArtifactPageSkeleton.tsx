import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Body skeleton while artifact preview refreshes or initial route segment loads. */
export function SignedRecordArtifactPageSkeleton(): React.JSX.Element {
  return (
    <div
      className={cn(OPERATOR_LAYOUT.sectionStack)}
      data-testid="signed-record-artifact-page-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full max-w-md" />
    </div>
  );
}
