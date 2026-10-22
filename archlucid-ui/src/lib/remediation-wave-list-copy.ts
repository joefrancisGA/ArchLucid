export const REMEDIATION_WAVES_SECTION_ID = "remediation-waves" as const;

export const REMEDIATION_WAVES_HEADING = "Remediation waves" as const;

export const REMEDIATION_WAVES_EMPTY_LABEL = "No remediation waves yet." as const;

export const REMEDIATION_WAVES_EMPTY_HELPER = "This list shows waves that already exist." as const;

export function formatRemediationWaveMembershipLine(name: string, memberCount: number): string {
  return `${name}: ${memberCount} findings in this wave.`;
}

export function formatRemediationWaveCapLine(targetSize: number): string {
  return `Cap ${targetSize}.`;
}
