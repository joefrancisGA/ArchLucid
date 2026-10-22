import { ArchitectureDraftWorkspaceLoadingSkeleton } from "@/components/architecture/ArchitectureDraftWorkspaceLoadingSkeleton";

export default function ArchitectureDraftDetailLoading(): React.JSX.Element {
  return (
    <div className="mt-6 space-y-3" data-testid="architecture-draft-detail-route-loading">
      <ArchitectureDraftWorkspaceLoadingSkeleton />
    </div>
  );
}
