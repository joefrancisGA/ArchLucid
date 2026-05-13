import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";

export function ReplayPageDemoShell() {
  return (
    <div>
      <LayerHeader pageKey="replay" density="compact" />
      <OperatorPageHeader title="Replay" helpKey="replay-run" />
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Replay not available in demo mode.</p>
        <p className="m-0 mt-1">Re-validating stored pipeline output requires a live API connection.</p>
      </div>
    </div>
  );
}
