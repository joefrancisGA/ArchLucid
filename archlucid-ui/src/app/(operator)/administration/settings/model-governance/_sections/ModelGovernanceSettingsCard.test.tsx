import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModelGovernanceSettingsCard } from "@/app/(operator)/administration/settings/model-governance/_sections/ModelGovernanceSettingsCard";
import {
  MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY,
  MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY,
  MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
} from "@/lib/model-governance-copy";

function expectAlertWithoutEngineeringLeakage() {
  const alert = screen.getByRole("alert");

  expect(alert.textContent).not.toMatch(/AdminAuthority/i);
  expect(alert.textContent).not.toMatch(/HTTP\s*\d+/i);
}

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
    expect(screen.getByTestId("model-execution-profile-controls")).toHaveTextContent("Effective profile: Balanced");
    expect(screen.getByTestId("model-execution-profile-controls")).not.toHaveTextContent("HighAssurance");
    expect(screen.getByTestId("model-governance-profile-mappings")).toHaveTextContent("Topology:");
    expect(screen.getByTestId("model-governance-profile-mappings").querySelector('[data-agent-type="Topology"]')).not.toBeNull();
  });

  it("humanizes effective profile and agent type labels without raw enum chrome (TB-1927)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("model-execution-profile")) {
        return new Response(
          JSON.stringify({
            effectiveProfile: "HighAssurance",
            source: "WorkspaceDefault",
            workspaceDefaultProfile: "HighAssurance",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(
          JSON.stringify({
            workspaceProfile: {
              effectiveProfile: "HighAssurance",
              source: "WorkspaceDefault",
              workspaceDefaultProfile: "HighAssurance",
            },
            registryEntries: [],
            profileMappings: [
              {
                profile: "HighAssurance",
                agentAliasMappings: [{ agentType: "SecurityReviewer", aliasId: "high-assurance-security" }],
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

    const profileControls = screen.getByTestId("model-execution-profile-controls");

    expect(profileControls).toHaveTextContent("High assurance");
    expect(profileControls).not.toHaveTextContent("HighAssurance");
    expect(profileControls.querySelector('[data-effective-profile="HighAssurance"]')).not.toBeNull();

    const mappings = screen.getByTestId("model-governance-profile-mappings");

    expect(mappings).toHaveTextContent("Security Reviewer:");
    expect(mappings).not.toHaveTextContent("SecurityReviewer:");
    expect(mappings.querySelector('[data-agent-type="SecurityReviewer"]')).not.toBeNull();
  });

  it("shows buyer-safe admin-required copy on 403 without AdminAuthority or HTTP leakage (TB-1926)", async () => {
    const fetchMock = vi.fn(async () => new Response("forbidden", { status: 403 }));

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY);
    });

    expectAlertWithoutEngineeringLeakage();
  });

  it("shows buyer-safe unavailable copy on non-auth load failure without HTTP leakage (TB-1926)", async () => {
    const fetchMock = vi.fn(async () => new Response("error", { status: 503 }));

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY);
    });

    expectAlertWithoutEngineeringLeakage();
  });

  it("shows buyer-safe update failure copy without HTTP leakage (TB-1926)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "PUT" && url.includes("model-execution-profile")) {
        return new Response("error", { status: 500 });
      }

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
            registryEntries: [],
            profileMappings: [],
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

    screen.getByRole("button", { name: "High assurance" }).click();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(MODEL_GOVERNANCE_UPDATE_FAILED_COPY);
    });

    expectAlertWithoutEngineeringLeakage();
  });

  it("keeps profile controls when catalog fetch fails (TB-1929)", async () => {
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
        return new Response("error", { status: 503 });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-controls")).toBeInTheDocument();
    });

    expect(screen.getByTestId("model-governance-catalog-unavailable")).toHaveTextContent(
      MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "High assurance" })).toBeInTheDocument();
  });

  it("shows guided empty state when governed alias registry is empty (TB-1929)", async () => {
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
            registryEntries: [],
            profileMappings: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-governance-registry-empty")).toBeInTheDocument();
    });

    expect(screen.getByTestId("model-governance-registry-empty")).toHaveTextContent(
      MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY,
    );
    expect(screen.getByTestId("model-governance-profile-mappings-empty")).toBeInTheDocument();
  });
});
