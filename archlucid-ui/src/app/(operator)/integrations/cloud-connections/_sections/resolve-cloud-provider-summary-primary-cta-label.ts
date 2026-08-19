import { isCloudProviderSummaryConfigured } from "./is-cloud-provider-summary-configured";

/** Primary CTA copy for cloud provider landing cards (TB-1141). */
export function resolveCloudProviderSummaryPrimaryCtaLabel(status: string): string {
  if (!isCloudProviderSummaryConfigured(status)) {
    return "Configure";
  }

  return "Open connection";
}
