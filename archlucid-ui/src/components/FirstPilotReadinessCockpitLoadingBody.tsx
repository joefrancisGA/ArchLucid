/** Lightweight skeleton shown while readiness probes are still in flight (expanded panel only). */
export function FirstPilotReadinessCockpitLoadingBody() {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-label="Loading workspace readiness details"
      data-testid="first-pilot-readiness-cockpit-loading"
    >
      <div className="h-4 w-56 max-w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-16 w-full animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-900" />
      <div className="h-24 w-full animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-900" />
    </div>
  );
}
