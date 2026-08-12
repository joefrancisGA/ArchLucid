import { GenericPageSkeleton } from "@/components/skeletons/GenericPageSkeleton";

/**
 * Neutral placeholder while operator shell authority or home access resolves.
 * Intentionally omits sidebar, top bar, and product nav labels (TB-730).
 */
export function OperatorShellAccessGateLoading() {
  return (
    <div
      data-testid="operator-shell-access-gate-loading"
      className="flex min-h-[50vh] flex-1 items-start pt-8"
      role="status"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <GenericPageSkeleton />
    </div>
  );
}
