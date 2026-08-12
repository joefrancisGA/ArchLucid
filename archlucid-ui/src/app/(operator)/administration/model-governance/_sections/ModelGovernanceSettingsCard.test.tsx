import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ModelGovernanceSettingsCard } from "@/app/(operator)/administration/model-governance/_sections/ModelGovernanceSettingsCard";
import {
  MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY,
  MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY,
  MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_MUTATION_RETRY_LABEL,
  MODEL_GOVERNANCE_PROFILE_AUDIT_DEEP_LINK_EVENT_TYPE,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_LABEL_COPY,
  MODEL_GOVERNANCE_PROFILE_LAST_CHANGED_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY,
  MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
} from "@/lib/model-governance-copy";

function profileResponse(overrides: Record<string, unknown> = {}) {
  return {
    effectiveProfile: "Balanced",
    source: "WorkspaceDefault",
    workspaceDefaultProfile: "Balanced",
    ...overrides,
  };
}

function catalogResponse(overrides: Record<string, unknown> = {}) {
  return {
    workspaceProfile: profileResponse(),
    registryEntries: [],
    profileMappings: [],
    ...overrides,
  };
}

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
        return new Response(JSON.stringify(profileResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(
          JSON.stringify(
            catalogResponse({
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
          ),
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

    expect(screen.getByTestId("model-governance-registry-table")).toHaveTextContent("balanced-default");
    expect(screen.getByTestId("model-execution-profile-controls")).toHaveTextContent("Effective profile: Balanced");
    expect(screen.getByTestId("model-execution-profile-controls")).toHaveTextContent("Source: Workspace default");
    expect(screen.getByTestId("model-governance-profile-mappings")).toHaveTextContent("Architecture structure:");
    expect(screen.getByTestId("model-governance-profile-mappings").querySelector('[data-agent-type="Topology"]')).not.toBeNull();
  });

  it("humanizes effective profile and agent type labels without raw enum chrome (TB-1927)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("model-execution-profile")) {
        return new Response(
          JSON.stringify(profileResponse({ effectiveProfile: "HighAssurance", workspaceDefaultProfile: "HighAssurance" })),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(
          JSON.stringify(
            catalogResponse({
              workspaceProfile: profileResponse({
                effectiveProfile: "HighAssurance",
                workspaceDefaultProfile: "HighAssurance",
              }),
              profileMappings: [
                {
                  profile: "HighAssurance",
                  agentAliasMappings: [{ agentType: "SecurityReviewer", aliasId: "high-assurance-security" }],
                },
              ],
            }),
          ),
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

  it("keeps catalog visible with inline mutation error and retry (P0-4)", async () => {
    const user = userEvent.setup();
    let putAttempts = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "PUT" && url.includes("model-execution-profile")) {
        putAttempts += 1;

        if (putAttempts === 1) {
          return new Response("error", { status: 500 });
        }

        return new Response(
          JSON.stringify(profileResponse({ effectiveProfile: "HighAssurance", source: "TenantOverride" })),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("model-execution-profile")) {
        return new Response(JSON.stringify(profileResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(JSON.stringify(catalogResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-segmented-control")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("model-execution-profile-option-HighAssurance"));
    await user.click(screen.getByRole("button", { name: MODEL_GOVERNANCE_PROFILE_CONFIRM_LABEL_COPY }));

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-mutation-error")).toHaveTextContent(
        MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
      );
    });

    expect(screen.getByTestId("model-governance-registry")).toBeInTheDocument();
    expectAlertWithoutEngineeringLeakage();

    await user.click(screen.getByRole("button", { name: MODEL_GOVERNANCE_MUTATION_RETRY_LABEL }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Workspace execution profile updated to High assurance.");
    });
  });

  it("requires confirmation before profile change and shows success receipt (P0-1)", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "PUT" && url.includes("model-execution-profile")) {
        return new Response(
          JSON.stringify(profileResponse({ effectiveProfile: "HighAssurance", source: "TenantOverride" })),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("model-execution-profile")) {
        return new Response(JSON.stringify(profileResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(JSON.stringify(catalogResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-segmented-control")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("model-execution-profile-option-HighAssurance"));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByTestId("model-execution-profile-tradeoffs")).toHaveTextContent("High assurance trade-offs");

    await user.click(screen.getByRole("button", { name: MODEL_GOVERNANCE_PROFILE_CONFIRM_LABEL_COPY }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Workspace execution profile updated to High assurance.");
    });
  });

  it("keeps selected profile focusable and only disables while saving (P0-3)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("model-execution-profile")) {
        return new Response(JSON.stringify(profileResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(JSON.stringify(catalogResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-segmented-control")).toBeInTheDocument();
    });

    const balancedOption = screen.getByTestId("model-execution-profile-option-Balanced");

    expect(balancedOption).toHaveAttribute("aria-checked", "true");
    expect(balancedOption).not.toBeDisabled();
  });

  it("shows last-changed attribution with audit deep link when API provides fields (P0-2)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("model-execution-profile")) {
        return new Response(
          JSON.stringify(
            profileResponse({
              lastChangedAtUtc: "2026-01-15T12:00:00Z",
              lastChangedBy: "admin@example.com",
            }),
          ),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(JSON.stringify(catalogResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-last-changed")).toBeInTheDocument();
    });

    expect(screen.getByTestId("model-execution-profile-last-changed")).toHaveTextContent("admin@example.com");
    expect(screen.getByTestId("model-execution-profile-audit-link")).toHaveAttribute(
      "href",
      `/governance/audit?eventType=${encodeURIComponent(MODEL_GOVERNANCE_PROFILE_AUDIT_DEEP_LINK_EVENT_TYPE)}`,
    );
  });

  it("shows honest unavailable attribution when API omits last-changed fields (P0-2)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("model-execution-profile")) {
        return new Response(JSON.stringify(profileResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(JSON.stringify(catalogResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-last-changed-unavailable")).toBeInTheDocument();
    });

    expect(screen.getByTestId("model-execution-profile-last-changed-unavailable")).toHaveTextContent(
      MODEL_GOVERNANCE_PROFILE_LAST_CHANGED_UNAVAILABLE_COPY,
    );
  });

  it("keeps profile controls when catalog fetch fails (TB-1929)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("model-execution-profile")) {
        return new Response(JSON.stringify(profileResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
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
    expect(screen.getByTestId("model-execution-profile-option-HighAssurance")).toBeInTheDocument();
  });

  it("shows guided empty state when governed alias registry is empty (TB-1929)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("model-execution-profile")) {
        return new Response(JSON.stringify(profileResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(JSON.stringify(catalogResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
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

  it("renders capability StatusTags and human task labels in EnterpriseTable (P0-6)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("model-execution-profile")) {
        return new Response(JSON.stringify(profileResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(
          JSON.stringify(
            catalogResponse({
              registryEntries: [
                {
                  aliasId: "balanced-default",
                  providerConnectionKind: "ArchLucidManaged",
                  capabilityTags: ["structured-output"],
                  approvedTaskTypes: ["Topology"],
                },
              ],
            }),
          ),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-governance-registry-table")).toBeInTheDocument();
    });

    const table = screen.getByTestId("model-governance-registry-table");

    expect(within(table).getByText("Structured output")).toBeInTheDocument();
    expect(within(table).getByText("Architecture structure")).toBeInTheDocument();
    expect(within(table).queryByText("ArchLucidManaged")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Security & Trust" })).toHaveAttribute("href", "/administration/security-trust");
  });

  it("confirms clear override and surfaces clear failure copy", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "DELETE" && url.includes("model-execution-profile")) {
        return new Response("error", { status: 500 });
      }

      if (url.includes("model-execution-profile")) {
        return new Response(
          JSON.stringify(profileResponse({ effectiveProfile: "Economy", source: "TenantOverride" })),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("model-governance-catalog")) {
        return new Response(JSON.stringify(catalogResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ModelGovernanceSettingsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-clear-override")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("model-execution-profile-clear-override"));
    await user.click(screen.getByRole("button", { name: "Use workspace default" }));

    await waitFor(() => {
      expect(screen.getByTestId("model-execution-profile-mutation-error")).toHaveTextContent(
        MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY,
      );
    });
  });
});
