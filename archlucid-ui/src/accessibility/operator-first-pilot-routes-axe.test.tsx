import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { beforeAll, describe, expect, it } from "vitest";

import SettingsPage from "@/app/(operator)/settings/page";
import { FirstPilotReadinessCockpit } from "@/components/FirstPilotReadinessCockpit";
import { IdentityProvidersSettingsPageView } from "@/app/(operator)/settings/identity-providers/_sections/IdentityProvidersSettingsPageView";

expect.extend(toHaveNoViolations);

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

describe("first-pilot operator routes — axe (Vitest)", () => {
  it("Settings page has no accessibility violations", async () => {
    const { container } = render(<SettingsPage />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("Identity providers settings view has no accessibility violations", async () => {
    const { container } = render(
      <IdentityProvidersSettingsPageView
        model={{
          note: null,
          rows: [
            {
              configPath: "ArchLucidAuth:Mode",
              isSet: true,
              effectiveValue: "DevelopmentBypass",
            },
          ],
          identityProviderDiagnostics: null,
          identityProviderDiagnosticsNote: null,
          identityProviderDiagnosticsLoaded: true,
          oidcDiagnostics: null,
          oidcDiagnosticsNote: null,
          oidcDiagnosticsLoaded: true,
          samlOperationalHealth: null,
          samlOperationalHealthNote: null,
          samlOperationalHealthLoaded: true,
        }}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("FirstPilotReadinessCockpit loading shell has no accessibility violations", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(JSON.stringify({ status: "Healthy", entries: [] }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/authority/projects/") && url.includes("/runs")) {
        await new Promise((resolve) => {
          setTimeout(resolve, 250);
        });

        return new Response(JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 40 }), {
          status: 200,
        });
      }

      if (url.includes("/api/proxy/v1/pilots/scorecard")) {
        return new Response(
          JSON.stringify({
            tenantId: "00000000-0000-0000-0000-000000000001",
            totalRunsCommitted: 0,
            totalManifestsCreated: 0,
            totalFindingsResolved: 0,
            averageTimeToManifestMinutes: null,
            totalAuditEventsGenerated: 0,
            totalGovernanceApprovalsCompleted: 0,
            firstCommitUtc: null,
            daysSinceFirstCommit: null,
            baselines: null,
            roiEstimate: null,
          }),
          { status: 200 },
        );
      }

      return originalFetch(input);
    }) as typeof fetch;

    try {
      const { container } = render(<FirstPilotReadinessCockpit />);

      expect(await axe(container)).toHaveNoViolations();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
