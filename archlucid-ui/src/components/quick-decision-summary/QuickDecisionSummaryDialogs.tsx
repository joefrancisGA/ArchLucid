import { FindingAiReasoningDialog } from "@/components/FindingAiReasoningDialog";
import { QuickDecisionFindingMuteDialog } from "@/components/findings/QuickDecisionFindingMuteDialog";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { ReactElement } from "react";

type QuickDecisionSummaryDialogsProps = {
  readonly runId: string;
  readonly reasoningOpen: boolean;
  readonly setReasoningOpen: (open: boolean) => void;
  readonly activeReasoning: QuickDecisionFinding | null;
  readonly setActiveReasoning: (finding: QuickDecisionFinding | null) => void;
  readonly muteOpen: boolean;
  readonly muteTarget: QuickDecisionFinding | null;
  readonly onMuteDialogOpenChange: (open: boolean) => void;
  readonly muteReasonInputId: string;
};

export function QuickDecisionSummaryDialogs({
  runId,
  reasoningOpen,
  setReasoningOpen,
  activeReasoning,
  setActiveReasoning,
  muteOpen,
  muteTarget,
  onMuteDialogOpenChange,
  muteReasonInputId,
}: QuickDecisionSummaryDialogsProps): ReactElement {
  return (
    <>
      <FindingAiReasoningDialog
        open={reasoningOpen}
        onOpenChange={(open) => {
          setReasoningOpen(open);

          if (!open) {
            setActiveReasoning(null);
          }
        }}
        findingId={activeReasoning?.findingId ?? null}
        findingTitle={activeReasoning?.title ?? ""}
        snapshot={activeReasoning?.aiReasoning ?? null}
      />
      <QuickDecisionFindingMuteDialog
        runId={runId}
        finding={muteTarget}
        open={muteOpen}
        onOpenChange={onMuteDialogOpenChange}
        reasonInputId={muteReasonInputId}
      />
    </>
  );
}
