import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";

/** Shown while the replay form client component is initializing (hydrates `runId` from the URL). */
export function ReplaySuspenseFallback() {
  return (
    <div>
      <LayerHeader pageKey="replay" density="compact" />
      <OperatorPageHeader title="Replay" helpKey="replay-run" />
      <OperatorLoadingNotice>
        <strong>Loading replay.</strong>
        <p className="mt-2 text-sm">
          Reading <code>runId</code> from the URL so “Replay this review” deep links open with the field prefilled…
        </p>
      </OperatorLoadingNotice>
    </div>
  );
}
