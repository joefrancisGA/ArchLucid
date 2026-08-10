import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for `/architectures/[architectureId]` while the draft hydrates (TB-1453). */
export function ArchitectureDraftWorkspaceLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      aria-busy="true"
      aria-label="Loading architecture draft"
      className="space-y-4"
      data-testid="architecture-draft-workspace-loading-skeleton"
      role="status"
    >
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-48 w-full max-w-4xl rounded-lg" />
    </div>
  );
}
