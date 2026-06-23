import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";

export function ReplayPageDemoShell() {
  return (
    <div>
      <LayerHeader pageKey="replay" density="compact" />
      <OperatorPageHeader title="Validate review package" helpKey="replay-run" />
      <DemoWorkspaceCapabilityUnavailablePanel
        layout="embedded"
        capability="Validate review package"
        description="In a connected tenant, operators validate stored review output for diagnostics and audit support."
      />
    </div>
  );
}
