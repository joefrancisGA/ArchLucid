import type { QuickScanFormValues } from "./quick-scan-validation";

export const QUICK_SCAN_EXAMPLE_FORM: QuickScanFormValues = {
  systemName: "Claims intake API",
  primaryEnvironment: "Azure",
  primaryEnvironmentOther: "",
  description:
    "A customer-facing REST API that accepts insurance claims, validates identity with Entra ID, stores documents in blob storage, and publishes events to a service bus for downstream adjudication. Internal workers run on AKS and call a legacy SQL database through a private endpoint.",
  architectureConcerns: ["Security", "Reliability", "Compliance"],
};
