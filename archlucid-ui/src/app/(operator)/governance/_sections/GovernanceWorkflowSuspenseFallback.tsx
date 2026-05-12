import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";

export function GovernanceWorkflowSuspenseFallback() {
  return (
    <div className="mx-auto max-w-4xl">
      <OperatorLoadingNotice>
        <strong>Loading governance workflow.</strong>
        <p className="mt-2 text-sm">Reading URL parameters…</p>
      </OperatorLoadingNotice>
    </div>
  );
}
