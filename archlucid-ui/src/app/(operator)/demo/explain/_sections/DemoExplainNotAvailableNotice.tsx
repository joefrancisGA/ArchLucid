export function DemoExplainNotAvailableNotice() {
  return (
    <div
      data-testid="demo-explain-not-available"
      role="status"
      className="rounded border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
    >
      <p className="m-0 font-medium">The example analysis is not available in this environment.</p>
    </div>
  );
}
