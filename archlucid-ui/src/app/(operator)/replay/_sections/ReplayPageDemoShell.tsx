import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";

export function ReplayPageDemoShell() {
  return (
    <div>
      <LayerHeader pageKey="replay" density="compact" />
      <OperatorPageHeader title="Replay" helpKey="replay-run" />
      <DemoWorkspaceCapabilityUnavailablePanel
        layout="embedded"
        capability="Review replay"
        description="In a connected tenant, operators re-validate stored pipeline output for diagnostics and audit support."
      />
    </div>
  );
}
