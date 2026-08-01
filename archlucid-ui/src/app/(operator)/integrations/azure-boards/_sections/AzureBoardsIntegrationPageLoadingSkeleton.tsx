import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function AzureBoardsIntegrationPageLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="azure-boards-loading-skeleton"
      aria-busy="true"
    >
      <div className={cn("min-w-0", OPERATOR_LAYOUT.majorSectionGap)}>
        <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>

      <div className={OPERATOR_LAYOUT.majorSectionGap}>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}
