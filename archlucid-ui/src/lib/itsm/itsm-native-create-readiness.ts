import type {
  ItsmIntegrationHealthResponse,
  TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";

export type ItsmOnboardingWizardStep = "prerequisites" | "settings" | "verify" | "runbooks";

export type ItsmIntegrationHealthProbe = ItsmIntegrationHealthResponse["jira"];

/** True when a vendor probe is locally configured and the read-only reachability check succeeded. */
export function isItsmProviderProbeReady(probe: ItsmIntegrationHealthProbe | null | undefined): boolean {
  return probe?.locallyConfigured === true && probe.reachable === true;
}

/** Native one-click create is the default operator path when deployment flag is on and at least one vendor probe is ready. */
export function isItsmNativeCreateDefaultPathReady(
  health: ItsmIntegrationHealthResponse | null | undefined,
): boolean {
  if (health?.nativeEnabled !== true) {
    return false;
  }

  return (
    isItsmProviderProbeReady(health.jira) || isItsmProviderProbeReady(health.serviceNow)
  );
}

export function hasItsmDeploymentCredentialsConfigured(
  settings: TenantItsmOutboundSettingsResponse | null | undefined,
): boolean {
  const credentials = settings?.deploymentCredentials;

  return credentials?.jiraConfigured === true || credentials?.serviceNowConfigured === true;
}

/** Chooses the onboarding wizard landing step from tenant settings + health probes (assessment Tier 2 #6). */
export function resolveItsmOnboardingWizardInitialStep(
  health: ItsmIntegrationHealthResponse | null | undefined,
  settings: TenantItsmOutboundSettingsResponse | null | undefined,
): ItsmOnboardingWizardStep {
  if (health?.nativeEnabled !== true) {
    return "prerequisites";
  }

  if (!hasItsmDeploymentCredentialsConfigured(settings)) {
    return "prerequisites";
  }

  if (isItsmNativeCreateDefaultPathReady(health)) {
    return settings?.hasTenantOverrides === true ? "runbooks" : "verify";
  }

  return "verify";
}
