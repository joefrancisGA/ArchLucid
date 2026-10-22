/** Relative path to the public ARM template served by the UI host. */
export const TRIAL_SAMPLE_AZURE_TEMPLATE_PATH = "/trial-sample-azure-template.json";

/**
 * Builds an Azure Portal custom-template deploy link for the trial sample environment.
 * The template must be reachable over HTTPS from the operator's browser (production/staging host).
 */
export function buildTrialSampleAzurePortalDeployUrl(templateAbsoluteUrl: string): string {
  const trimmed = templateAbsoluteUrl.trim();

  if (trimmed.length === 0) {
    throw new Error("templateAbsoluteUrl is required.");
  }

  const encoded = encodeURIComponent(trimmed);

  return `https://portal.azure.com/#create/Microsoft.Template/uri/${encoded}`;
}

/**
 * Resolves the template URL from the current browser origin (client-only).
 */
export function resolveTrialSampleAzureTemplateUrl(origin: string): string {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;

  return `${base}${TRIAL_SAMPLE_AZURE_TEMPLATE_PATH}`;
}
