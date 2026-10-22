export type QuickScanFinding = Readonly<{
  title: string;
  description: string;
  severity?: number;
}>;

export type QuickScanResponse = Readonly<{
  scanId: string;
  systemName: string;
  primaryEnvironment: string;
  summary: string;
  completedUtc?: string;
  findings?: QuickScanFinding[];
  positiveObservations?: string[];
  recommendedNextSteps?: string[];
  isSampleResult?: boolean;
  demonstrationDisclaimer?: string;
}>;

export type QuickScanStatusResponse = Readonly<{
  enabled: boolean;
  capacityAvailable: boolean;
  requireSignIn: boolean;
  sampleResultAvailable: boolean;
  operationalMode?: string;
  publicMessage?: string | null;
  capacityState?: string;
  capacityStateMessage?: string;
}>;
