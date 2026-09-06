import { ARCHITECTURE_IDENTITY_LIST_LOADING_LABEL } from "@/lib/architecture/architecture-identity-desk-copy";

export function ArchitectureIdentityDeskSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="architecture-identity-desk-loading" aria-busy="true">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{ARCHITECTURE_IDENTITY_LIST_LOADING_LABEL}</p>
      <div className="h-8 w-2/5 max-w-sm animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />
      <div className="h-40 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />
    </div>
  );
}
