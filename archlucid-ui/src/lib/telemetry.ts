import { ApplicationInsights } from "@microsoft/applicationinsights-web";

let appInsights: ApplicationInsights | null = null;

export function getAppInsights() {
  if (typeof window !== "undefined" && !appInsights) {
    const connectionString = process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING;
    if (connectionString) {
      appInsights = new ApplicationInsights({
        config: {
          connectionString,
          enableAutoRouteTracking: true,
        },
      });
      appInsights.loadAppInsights();
    }
  }
  return appInsights;
}

export function trackWizardStepViewed(stepIndex: number, stepLabel: string, wizardType: string) {
  const ai = getAppInsights();
  if (ai) {
    ai.trackEvent(
      { name: "WizardStepViewed" },
      { stepIndex, stepLabel, wizardType }
    );
  }
}

export function trackWizardCompleted(wizardType: string) {
  const ai = getAppInsights();
  if (ai) {
    ai.trackEvent({ name: "WizardCompleted" }, { wizardType });
  }
}

export function trackWizardValidationFailed(
  wizardType: string,
  stepIndex: number,
  stepLabel: string,
  reason: string,
) {
  const ai = getAppInsights();
  if (ai) {
    ai.trackEvent(
      { name: "WizardValidationFailed" },
      { wizardType, stepIndex, stepLabel, reason },
    );
  }
}
