export type ForthcomingCloudProviderRow = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
};

/** Honest V1.1 roadmap rows — disabled in UI until connectors ship (TB-343). */
export const FORTHCOMING_CLOUD_PROVIDER_ROWS: readonly ForthcomingCloudProviderRow[] = [
  {
    id: "aws",
    name: "Amazon Web Services",
    description: "Continuous ingestion from AWS accounts — planned for V1.1.",
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    description: "Continuous ingestion from GCP projects — planned for V1.1.",
  },
];
