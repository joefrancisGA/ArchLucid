export const QUICK_SCAN_MAX_SYSTEM_NAME = 100;
export const QUICK_SCAN_MAX_DESCRIPTION = 1500;
export const QUICK_SCAN_MAX_CONCERNS = 3;

export const QUICK_SCAN_PRIMARY_ENVIRONMENTS = [
  { value: "Azure", label: "Azure" },
  { value: "AWS", label: "AWS" },
  { value: "GoogleCloud", label: "Google Cloud" },
  { value: "Multicloud", label: "Multicloud" },
  { value: "HybridCloud", label: "Hybrid cloud" },
  { value: "OnPremises", label: "On-premises" },
  { value: "ProviderNeutral", label: "Provider-neutral" },
  { value: "Other", label: "Other" },
  { value: "NotSure", label: "Not sure" },
] as const;

export type QuickScanPrimaryEnvironmentValue =
  (typeof QUICK_SCAN_PRIMARY_ENVIRONMENTS)[number]["value"];

export const QUICK_SCAN_ARCHITECTURE_CONCERNS = [
  { value: "Security", label: "Security" },
  { value: "Reliability", label: "Reliability" },
  { value: "Cost", label: "Cost" },
  { value: "Performance", label: "Performance" },
  { value: "Compliance", label: "Compliance" },
  { value: "Operations", label: "Operations" },
] as const;

export type QuickScanArchitectureConcernValue =
  (typeof QUICK_SCAN_ARCHITECTURE_CONCERNS)[number]["value"];

export const QUICK_SCAN_RECEIVE_ITEMS = [
  "Key architecture risks",
  "Missing or unclear controls",
  "Reliability, security, cost, and operational observations",
  "Recommended next steps",
] as const;
