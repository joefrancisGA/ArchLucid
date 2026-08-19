import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_CARD, OPERATOR_SURFACE_CARD_CLASS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type OperatorHomeRunsDashboardListSkeletonProps = {
  readonly rowCount?: number;
};

/** Loading placeholder for Overview recent review rows. */
export function OperatorHomeRunsDashboardListSkeleton(
  props: OperatorHomeRunsDashboardListSkeletonProps,
): React.JSX.Element {
  const rowCount = props.rowCount ?? 2;

  return (
    <div className="space-y-2" data-testid="runs-dashboard-recent-loading">
      {Array.from({ length: rowCount }, (_, index) => (
        <div
          key={index}
          className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.nested, "space-y-2")}
          data-testid={`runs-dashboard-recent-loading-row-${index}`}
        >
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-3 w-3/5" />
        </div>
      ))}
    </div>
  );
}
