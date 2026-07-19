import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModelGovernanceSettingsCard } from "@/app/(operator)/settings/model-governance/_sections/ModelGovernanceSettingsCard";

describe("ModelGovernanceSettingsCard", () => {
  it("loads catalog and profile controls for admin session", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("model-execution-profile")) {
        return new Response(
          JSON.stringify({
            effectiveProfile: "Balanced",
            source: "WorkspaceDefault",
            workspaceDefaultProfile: "Balanced",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(
          JSON.stringify({
            workspaceProfile: {
              effectiveProfile: "Balanced",
              source: "WorkspaceDefault",
              workspaceDefaultProfile: "Balanced",
            },
            registryEntries: [
              {
                aliasId: "balanced-default",
                providerConnectionKind: "ArchLucidManaged",
                capabilityTags: ["structured-output"],
                approvedTaskTypes: ["Topology"],
              },
            ],
            profileMappings: [
              {
                profile: "Balanced",
                agentAliasMappings: [{ agentType: "Topology", aliasId: "balanced-default" }],
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-controls")).toBeInTheDocument();
    });

    expect(screen.getByTestId("model-governance-registry")).toHaveTextContent("balanced-default");
  });
});
