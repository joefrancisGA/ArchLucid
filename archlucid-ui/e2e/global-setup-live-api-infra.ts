import { request } from "@playwright/test";

import { probeLiveApiInfrastructureReady } from "./helpers/live-api-infra-guard";

/** Runs once before live-API Playwright specs — surfaces SQL/API warmup failures as a single setup error. */
export default async function globalSetupLiveApiInfra(): Promise<void> {
  const api = await request.newContext();
  const maxAttempts = Number.parseInt(process.env.E2E_INFRA_PROBE_ATTEMPTS ?? "45", 10) || 45;
  const delayMs = Number.parseInt(process.env.E2E_INFRA_PROBE_DELAY_MS ?? "2000", 10) || 2000;

  try {
    const probe = await probeLiveApiInfrastructureReady(api, { maxAttempts, delayMs });

    if (!probe.ready) {
      throw new Error(probe.reason ?? "Live API infrastructure not ready");
    }
  } finally {
    await api.dispose();
  }
}
