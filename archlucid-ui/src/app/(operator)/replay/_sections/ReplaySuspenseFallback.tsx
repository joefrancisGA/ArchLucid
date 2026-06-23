import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";

/** Shown while the validate form client component is initializing (hydrates review context from the URL). */
export function ReplaySuspenseFallback() {
  return (
    <div>
      <LayerHeader pageKey="replay" density="compact" />
      <OperatorPageHeader title="Validate review package" helpKey="replay-run" />
      <OperatorLoadingNotice>
        <strong>Loading validation.</strong>
        <p className="mt-2 text-sm">
          Reading review context from the link so validate opens with the review package prefilled…
        </p>
      </OperatorLoadingNotice>
    </div>
  );
}
