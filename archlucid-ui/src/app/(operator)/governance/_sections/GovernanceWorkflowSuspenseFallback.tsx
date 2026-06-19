import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";

export function GovernanceWorkflowSuspenseFallback() {
  return (
    <div className="w-full max-w-[1200px]">
      <OperatorLoadingNotice>
        <strong>Loading governance workflow.</strong>
        <p className="mt-2 text-sm">Reading URL parameters…</p>
      </OperatorLoadingNotice>
    </div>
  );
}
