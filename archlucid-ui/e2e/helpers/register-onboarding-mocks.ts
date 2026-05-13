import type { Page, Route } from "@playwright/test";

import { SHOWCASE_DEMO_RUN_ID } from "../fixtures/ids";
import { backendApiPath } from "./route-match";

/** Mirrors trial-funnel stub identifiers — avoids coupling imports from other specs. */
const TRIAL_TENANT_ID = "11111111-1111-1111-1111-111111111111";
const TRIAL_WORKSPACE_ID = "22222222-2222-2222-2222-222222222222";
const TRIAL_PROJECT_ID = "33333333-3333-3333-3333-333333333333";

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

/**
 * Minimal mocked payloads for the post-registration onboarding rail (`GET /v1/tenant/trial-status`) and read-only
 * identity alignment (`GET /v1/admin/configuration/summary`). Other backend proxy requests fall through to the mock API server.
 */
export async function registerFreshTenantOnboardingMocks(page: Page): Promise<void> {
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = backendApiPath(url);

    if (path === null) {
      await route.continue();

      return;
    }

    const method = req.method();

    if (method === "POST" && path === "/v1/register") {
      await fulfillJson(route, 201, {
        tenantId: TRIAL_TENANT_ID,
        defaultWorkspaceId: TRIAL_WORKSPACE_ID,
        defaultProjectId: TRIAL_PROJECT_ID,
        wasAlreadyProvisioned: false,
      });

      return;
    }

    if (method === "GET" && path === "/v1/tenant/trial-status") {
      await fulfillJson(route, 200, {
        status: "Active",
        trialStartUtc: "2026-04-14T12:00:00.000Z",
        trialExpiresUtc: "2026-04-28T12:00:00.000Z",
        daysRemaining: 7,
        trialRunsUsed: 0,
        trialRunsLimit: 5,
        trialSeatsUsed: 1,
        trialSeatsLimit: 3,
        trialWelcomeRunId: SHOWCASE_DEMO_RUN_ID,
        trialSampleRunId: SHOWCASE_DEMO_RUN_ID,
      });

      return;
    }

    if (method === "GET" && path.startsWith("/v1/admin/configuration/summary")) {
      await fulfillJson(route, 200, {
        keys: [
          {
            configPath: "ArchLucidAuth:Mode",
            section: "ArchLucidAuth",
            description: "Authentication mode for operator sessions.",
            isSet: true,
            effectiveValue: "JwtBearer",
            requirementKind: "Security",
            sources: ["appsettings", "KeyVault"],
          },
          {
            configPath: "ArchLucidAuth:Authority",
            section: "ArchLucidAuth",
            description: "OIDC authority (Microsoft Entra ID v2.0 issuer).",
            isSet: true,
            effectiveValue: "https://login.microsoftonline.com/aaaaaaaa-bbbb-cccc-dddddddddddd/v2.0",
            requirementKind: "Security",
            sources: ["appsettings"],
          },
          {
            configPath: "ArchLucidAuth:Audience",
            section: "ArchLucidAuth",
            description: "Expected JWT audience (API application ID URI).",
            isSet: true,
            effectiveValue: "api://archlucid-onboarding-demo",
            requirementKind: "Security",
            sources: ["appsettings"],
          },
          {
            configPath: "ArchLucidAuth:NameClaimType",
            section: "ArchLucidAuth",
            description: "Claim mapped to the operator display name.",
            isSet: true,
            effectiveValue: "preferred_username",
            requirementKind: "Optional",
            sources: ["appsettings"],
          },
        ],
      });

      return;
    }

    await route.continue();
  });
}
