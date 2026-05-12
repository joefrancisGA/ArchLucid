import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminConfigurationPage from "@/app/(operator)/admin/configuration/page";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

vi.mock("@/lib/demo-ui-env", () => ({
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

expect.extend(toHaveNoViolations);

describe("AdminConfigurationPage — axe (Vitest)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(
    "has no serious axe violations when configuration summary loads",
    async () => {
      const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
        const s =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input instanceof Request
                ? input.url
                : String(input);

        if (s.includes("/v1/admin/configuration/summary")) {
          return jsonResponse({
            keys: [
              {
                section: "Hosting",
                configPath: "Hosting:Role",
                isSet: true,
                requirementKind: "None",
                description: "Api, Worker, or Combined host process.",
                sources: ["appsettings", "env"],
                effectiveValue: "Combined",
              },
            ],
          });
        }

        if (s.includes("/v1/admin/config-lint")) {
          return jsonResponse({
            hostingEnvironmentName: "Development",
            ok: true,
            blockingFindings: [],
            advisoryFindings: [],
          });
        }

        return new Response("not found", { status: 404 });
      });
      vi.stubGlobal("fetch", fetchMock);

      const { container } = render(<AdminConfigurationPage />);

      expect(await screen.findByTestId("admin-configuration-table-hosting")).toBeInTheDocument();

      expect(await axe(container)).toHaveNoViolations();
    },
    25_000,
  );
});
