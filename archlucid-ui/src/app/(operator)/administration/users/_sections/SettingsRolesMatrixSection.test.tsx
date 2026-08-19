import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { SettingsRolesMatrixSection } from "./SettingsRolesMatrixSection";

const sampleRoles = [
  {
    id: "role-admin",
    name: "Admin",
    description: null,
    permissions: ["Runs.Read", "Billing.Manage", "AdminConsole.Access", "Audit.Export"],
    isSystem: true,
    updatedUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: "role-auditor",
    name: "Auditor",
    description: null,
    permissions: ["Runs.Read", "Audit.Read", "Audit.Export"],
    isSystem: true,
    updatedUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: "role-reader",
    name: "Reader",
    description: null,
    permissions: ["Runs.Read", "Audit.Read"],
    isSystem: true,
    updatedUtc: "2026-01-01T00:00:00Z",
  },
];

const rolesWithCustomColumn = [
  {
    id: "role-operator",
    name: "Operator",
    description: null,
    permissions: ["Runs.Read", "Runs.Commit"],
    isSystem: true,
    updatedUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: "role-custom",
    name: "Reviewer plus",
    description: null,
    permissions: ["Runs.Read"],
    isSystem: false,
    updatedUtc: "2026-01-02T12:00:00Z",
  },
];

function stubRolesResponse(payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } })),
  );
}

describe("SettingsRolesMatrixSection", () => {
  it("renders create form, legend, and accessible permission values", async () => {
    stubRolesResponse(sampleRoles);

    render(<SettingsRolesMatrixSection assignmentCountsByRole={new Map([["Reader", 2]])} />);

    expect(await screen.findByTestId("settings-roles-matrix-legend")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create custom role" })).toBeInTheDocument();
    expect(screen.getByText(/Built-in roles cannot be edited/i)).toBeInTheDocument();
    expect(screen.queryByTestId("settings-roles-builtin-summary")).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-create-readiness")).toHaveTextContent("Enter a role name");

    const readReviewsCell = await screen.findByLabelText("Read reviews for Reader: Allowed");
    expect(readReviewsCell).toBeInTheDocument();
    expect(within(readReviewsCell).getByText("Allowed")).toHaveClass("sr-only");

    const billingCell = screen.getByLabelText("Manage billing for Reader: Not allowed");
    expect(billingCell).toBeInTheDocument();
    expect(screen.getByText("2 assignments")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reviews permissions" }));
    expect(screen.queryByLabelText("Read reviews for Reader: Allowed")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows audit export differences between Auditor and Reader above the fold", async () => {
    stubRolesResponse(sampleRoles);

    render(<SettingsRolesMatrixSection />);

    await screen.findByRole("heading", { name: "Create custom role" });

    expect(screen.getByLabelText("Export audit for Auditor: Allowed")).toBeInTheDocument();
    expect(screen.getByLabelText("Export audit for Reader: Not allowed")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("displays the Operator role as Architect and discloses its claim value", async () => {
    stubRolesResponse(rolesWithCustomColumn);

    render(<SettingsRolesMatrixSection />);

    expect(await screen.findByRole("columnheader", { name: /Architect/ })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /^Operator/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clone Architect role" })).toBeInTheDocument();
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("flags unsaved edits in the command bar and saves from there", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = typeof input === "string" ? input : input.url;

      if (url.includes("/api/proxy/v1/admin/roles/role-custom")) {
        return new Response(null, { status: 200 });
      }

      return new Response(JSON.stringify(rolesWithCustomColumn), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsRolesMatrixSection />);

    await screen.findByRole("heading", { name: "Create custom role" });

    expect(screen.queryByTestId("settings-roles-command-bar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Create reviews for Reviewer plus"));

    expect(screen.getByTestId("settings-roles-unsaved-notice")).toHaveTextContent("Reviewer plus");
    expect(screen.getByTestId("settings-roles-command-bar")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-unsaved-badge-role-custom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Reviewer plus role" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Discard unsaved changes to Reviewer plus" }));

    expect(screen.queryByTestId("settings-roles-command-bar")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows load error state with refresh affordance", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );

    render(<SettingsRolesMatrixSection />);

    expect(await screen.findByText("Role matrix unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.queryByTestId("settings-roles-matrix-legend")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows assignments unavailable when counts are unreliable", async () => {
    stubRolesResponse(sampleRoles);

    render(<SettingsRolesMatrixSection assignmentCountsReliable={false} />);

    expect((await screen.findAllByText("Assignments unavailable")).length).toBeGreaterThan(0);
    expect(screen.queryByText("2 assignments")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("marks high-risk permissions inline in the matrix", async () => {
    stubRolesResponse(sampleRoles);

    render(<SettingsRolesMatrixSection />);

    await screen.findByRole("heading", { name: "Create custom role" });

    expect(screen.getAllByText("High risk").length).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });
});
