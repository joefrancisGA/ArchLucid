import type { ApplicationInsights } from "@microsoft/applicationinsights-web";

let appInsights: ApplicationInsights | null = null;
let loadPromise: Promise<ApplicationInsights | null> | null = null;

async function loadAppInsights(): Promise<ApplicationInsights | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (appInsights) {
    return appInsights;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const connectionString = process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING;

    if (!connectionString) {
      return null;
    }

    const { ApplicationInsights: ApplicationInsightsCtor } = await import("@microsoft/applicationinsights-web");
    appInsights = new ApplicationInsightsCtor({
      config: {
        connectionString,
        enableAutoRouteTracking: true,
      },
    });
    appInsights.loadAppInsights();

    return appInsights;
  })();

  return loadPromise;
}

/** Starts Application Insights loading; resolves when the SDK is ready (or skipped when unconfigured). */
export function ensureAppInsights(): Promise<ApplicationInsights | null> {
  return loadAppInsights();
}

/** Returns the SDK instance only after a prior {@link ensureAppInsights} load has finished. */
export function getAppInsights(): ApplicationInsights | null {
  return appInsights;
}

function trackWithAppInsights(track: (ai: ApplicationInsights) => void): void {
  void loadAppInsights().then((ai) => {
    if (ai) {
      track(ai);
    }
  });
}

export function trackWizardStepViewed(stepIndex: number, stepLabel: string, wizardType: string) {
  trackWithAppInsights((ai) => {
    ai.trackEvent(
      { name: "WizardStepViewed" },
      { stepIndex, stepLabel, wizardType },
    );
  });
}

export function trackWizardCompleted(wizardType: string) {
  trackWithAppInsights((ai) => {
    ai.trackEvent({ name: "WizardCompleted" }, { wizardType });
  });
}

export function trackWizardValidationFailed(
  wizardType: string,
  stepIndex: number,
  stepLabel: string,
  reason: string,
) {
  trackWithAppInsights((ai) => {
    ai.trackEvent(
      { name: "WizardValidationFailed" },
      { wizardType, stepIndex, stepLabel, reason },
    );
  });
}
