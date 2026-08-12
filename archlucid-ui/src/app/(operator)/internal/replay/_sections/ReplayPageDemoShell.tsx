import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";

export function ReplayPageDemoShell() {
  return (
    <div>
      <LayerHeader pageKey="replay" density="compact" />
      <OperatorPageHeader title="Validate review" helpKey="replay-run" />
      <DemoWorkspaceCapabilityUnavailablePanel
        layout="embedded"
        capability="Validate review"
        description="In a connected tenant, architects validate stored review output for diagnostics and audit support."
      />
    </div>
  );
}
