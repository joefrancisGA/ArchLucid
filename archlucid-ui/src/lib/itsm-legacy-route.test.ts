import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildItsmAtlassianOAuthRedirectUri } from "@/lib/api/itsm-outbound-api";
import {
  INTEGRATIONS_READINESS_PATH,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH,
  REMOVED_INTEGRATIONS_ITSM_HUB_PATH,
} from "@/lib/integrations-nav-paths";
import { ITSM_CONNECTOR_SMOKE_HELP, ITSM_PRODUCT_SMOKE_VERIFICATION_HREF } from "@/lib/itsm-connectors-admin-scope";
import { ITSM_PRODUCT_CANONICAL_DEEP_LINKS } from "@/lib/itsm-product-canonical-deep-links";
import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";

import nextConfig from "../../next.config";

const ITSM_REMOVED_HUB_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "integrations",
  "itsm",
  "page.tsx",
);

const ITSM_OAUTH_CALLBACK_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "integrations",
  "itsm",
  "oauth",
  "callback",
  "page.tsx",
);

const ITSM_DEAD_CLIENT_FILES = [
  join(process.cwd(), "src", "app", "(operator)", "integrations", "itsm", "_sections", "ItsmIntegrationPageClient.tsx"),
  join(
    process.cwd(),
    "src",
    "app",
    "(operator)",
    "integrations",
    "itsm",
    "_sections",
    "ItsmConnectorConnectionSection.tsx",
  ),
];

const ITSM_PRODUCT_DEEP_LINK_SURFACES = [
  "archlucid-ui/src/app/(operator)/integrations/_sections/itsm/ItsmProductIntegrationPageClient.tsx",
  "archlucid-ui/src/app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationAside.tsx",
  "archlucid-ui/src/components/FindingItsmExportPanel.tsx",
  "archlucid-ui/src/components/work-items/CreateWorkItemDialog.tsx",
] as const;

describe("ITSM removed hub route (TB-1777 / TB-1778)", () => {
  it("does not redirect removed hub / operations / readiness paths", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(
      redirectRules?.some(
        (entry) =>
          entry.source === REMOVED_INTEGRATIONS_ITSM_HUB_PATH
          || entry.source === "/integrations/operations"
          || entry.source === "/integrations/operations/:path*"
          || entry.source === "/integrations/readiness"
          || entry.source === "/integrations/readiness/:path*",
      ),
    ).toBe(false);
  });

  it("does not treat the Atlassian OAuth callback as a permanent redirect hop", () => {
    expect(hrefTargetsPermanentRedirectSource(REMOVED_INTEGRATIONS_ITSM_HUB_PATH)).toBe(false);
    expect(hrefTargetsPermanentRedirectSource(ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH)).toBe(false);
  });

  it("keeps buildItsmAtlassianOAuthRedirectUri on the callback page path", () => {
    const redirectUri = buildItsmAtlassianOAuthRedirectUri();
    const pathname = redirectUri.startsWith("/")
      ? redirectUri
      : new URL(redirectUri).pathname;

    expect(pathname).toBe(ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH);
  });

  it("ships the OAuth callback App Router page", () => {
    expect(existsSync(ITSM_OAUTH_CALLBACK_APP_PAGE)).toBe(true);
  });

  it("does not list removed ITSM hub among permanent redirect sources", () => {
    expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(REMOVED_INTEGRATIONS_ITSM_HUB_PATH);
  });

  it("removes the hub App Router page and dead unified clients", () => {
    expect(existsSync(ITSM_REMOVED_HUB_APP_PAGE)).toBe(false);

    for (const deadPath of ITSM_DEAD_CLIENT_FILES) {
      expect(existsSync(deadPath)).toBe(false);
    }
  });

  it("keeps product deep-links off the removed hub path", () => {
    const repoRoot = join(process.cwd(), "..");
    const bannedHubHref = `"${REMOVED_INTEGRATIONS_ITSM_HUB_PATH}"`;

    for (const relativePath of ITSM_PRODUCT_DEEP_LINK_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).not.toContain(bannedHubHref);
      expect(source).not.toContain(`href="${REMOVED_INTEGRATIONS_ITSM_HUB_PATH}"`);
      expect(source).not.toContain(`href='${REMOVED_INTEGRATIONS_ITSM_HUB_PATH}'`);
    }

    const productSurface = readFileSync(join(repoRoot, ITSM_PRODUCT_DEEP_LINK_SURFACES[0]), "utf8");

    expect(productSurface).toContain("INTEGRATIONS_READINESS_PATH");
    expect(ITSM_PRODUCT_CANONICAL_DEEP_LINKS.jira).toBe(ITSM_CONNECTOR_SMOKE_HELP.jira);
    expect(ITSM_CONNECTOR_SMOKE_HELP.jira).not.toBe(REMOVED_INTEGRATIONS_ITSM_HUB_PATH);
    expect(ITSM_CONNECTOR_SMOKE_HELP.serviceNow).not.toBe(REMOVED_INTEGRATIONS_ITSM_HUB_PATH);
    expect(ITSM_PRODUCT_SMOKE_VERIFICATION_HREF).toBe(INTEGRATIONS_READINESS_PATH);
  });
});
