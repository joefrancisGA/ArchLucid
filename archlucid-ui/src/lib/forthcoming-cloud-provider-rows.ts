export type ForthcomingCloudProviderRow = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
};

/** Admin/diagnostics-only rows — customer connect flows live on `/integrations/cloud-connections` (TB-407). */
export const FORTHCOMING_CLOUD_PROVIDER_ROWS: readonly ForthcomingCloudProviderRow[] = [
  {
    id: "aws",
    name: "Amazon Web Services",
    description: "Tier 2 hosted polling — customer UI at /integrations/cloud-connections (AWS section).",
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    description: "Tier 2 hosted polling — customer UI at /integrations/cloud-connections (GCP section).",
  },
];
