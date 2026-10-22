import type { APIRequestContext } from "@playwright/test";

import {
  LIVE_E2E_DEFAULT_PROJECT_ID,
  LIVE_E2E_DEFAULT_TENANT_ID,
  LIVE_E2E_DEFAULT_WORKSPACE_ID,
} from "./live-private-beta-access";
import { liveApiBase, liveJsonHeaders } from "./live-api-client";
import { mergeTenantScope } from "./live-api-headers";

/** Verifies the JwtBearer API exposes the Enterprise-only SCIM admin route before UI smoke. */
export async function requireLiveScimAdminPreflight(request: APIRequestContext): Promise<void> {
  const response = await request.get(`${liveApiBase}/v1/admin/scim/tokens`, {
    headers: mergeTenantScope(liveJsonHeaders(), {
      tenantId: LIVE_E2E_DEFAULT_TENANT_ID,
      workspaceId: LIVE_E2E_DEFAULT_WORKSPACE_ID,
      projectId: LIVE_E2E_DEFAULT_PROJECT_ID,
    }),
    timeout: 60_000,
  });

  if (response.ok()) {
    return;
  }

  const body = (await response.text()).slice(0, 400);
  if (response.status() === 404) {
    throw new Error(
      `SCIM admin preflight returned 404. Confirm the CI tenant is Enterprise and restart ArchLucid.Api after the Enterprise grant so tenant-tier cache is refreshed. Body: ${body}`,
    );
  }

  throw new Error(`SCIM admin preflight GET /v1/admin/scim/tokens failed ${response.status()}: ${body}`);
}
