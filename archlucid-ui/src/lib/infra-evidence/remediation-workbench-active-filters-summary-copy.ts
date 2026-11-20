/** Buyer scan line when status and wave URL filters are both active (instances may still be visible). */
export const REMEDIATION_WORKBENCH_ACTIVE_FILTERS_SUMMARY_INTRO_LINE =
  "Active lifecycle filters:" as const;

export function formatRemediationWorkbenchActiveFiltersSummary(statusLabel: string, waveId: string): string {
  return `${REMEDIATION_WORKBENCH_ACTIVE_FILTERS_SUMMARY_INTRO_LINE} status ${statusLabel}, wave ${waveId}.`;
}