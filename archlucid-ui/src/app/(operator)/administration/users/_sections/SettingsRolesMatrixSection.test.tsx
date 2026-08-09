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
    permissions: ["Runs.Read", "Billing.Manage", "AdminConsole.Access"],
    isSystem: true,
    updatedUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: "role-reader",
    name: "Reader",
    description: null,
    permissions: ["Runs.Read"],
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
    updatedUtc: "2026-01-01T00:00:00Z",
  },
];

function stubRolesResponse(payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } })),
  );
}

describe("SettingsRolesMatrixSection", () => {
  it("renders role summaries, create form, and accessible permission values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(sampleRoles), { status: 200, headers: { "Content-Type": "application/json" } })),
    );

    render(<SettingsRolesMatrixSection />);

    expect(await screen.findByTestId("settings-roles-builtin-summary")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create custom role" })).toBeInTheDocument();
    expect(screen.getByText(/Built-in roles cannot be edited/i)).toBeInTheDocument();
    expect(screen.queryByText(/Clone to custom role/i)).not.toBeInTheDocument();

    const readReviewsCell = await screen.findByLabelText("Read reviews for Reader: Allowed");
    expect(readReviewsCell).toBeInTheDocument();
    expect(within(readReviewsCell).getByText("Allowed")).toHaveClass("sr-only");

    const billingCell = screen.getByLabelText("Manage billing for Reader: Not allowed");
    expect(billingCell).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reviews permissions" }));
    expect(screen.queryByLabelText("Read reviews for Reader: Allowed")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("displays the Operator role as Architect and discloses its claim value", async () => {
    stubRolesResponse(rolesWithCustomColumn);

    render(<SettingsRolesMatrixSection />);

    const summary = await screen.findByTestId("settings-roles-builtin-summary");
    expect(within(summary).getByText("Architect")).toBeInTheDocument();
    expect(within(summary).getByText("Claim value: Operator")).toBeInTheDocument();

    expect(screen.getByRole("columnheader", { name: /Architect/ })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /^Operator/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clone Architect role into the create form" })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("flags unsaved column edits, enables Save only when dirty, and discards on request", async () => {
    stubRolesResponse(rolesWithCustomColumn);

    render(<SettingsRolesMatrixSection />);

    await screen.findByTestId("settings-roles-builtin-summary");

    expect(screen.getByRole("button", { name: "Save Reviewer plus role" })).toBeDisabled();
    expect(screen.queryByTestId("settings-roles-unsaved-notice")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Create reviews for Reviewer plus"));

    expect(screen.getByTestId("settings-roles-unsaved-notice")).toHaveTextContent("Reviewer plus");
    expect(screen.getByTestId("settings-roles-unsaved-badge-role-custom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Reviewer plus role" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Discard unsaved changes to Reviewer plus" }));

    expect(screen.queryByTestId("settings-roles-unsaved-notice")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Reviewer plus role" })).toBeDisabled();

    vi.unstubAllGlobals();
  });

  it("prefills the create form when cloning instead of writing a role immediately", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(rolesWithCustomColumn), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsRolesMatrixSection />);

    await screen.findByTestId("settings-roles-builtin-summary");
    const requestsAfterLoad = fetchMock.mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: "Clone Architect role into the create form" }));

    expect(screen.getByLabelText("Role name")).toHaveValue("Architect (custom)");
    expect(fetchMock.mock.calls.length).toBe(requestsAfterLoad);

    vi.unstubAllGlobals();
  });

  it("explains why the create button is unavailable", async () => {
    stubRolesResponse(rolesWithCustomColumn);

    render(<SettingsRolesMatrixSection />);

    await screen.findByTestId("settings-roles-builtin-summary");

    expect(screen.getByRole("button", { name: "Create custom role" })).toBeDisabled();
    expect(screen.getByTestId("settings-roles-create-readiness")).toHaveTextContent(/enter a role name/i);

    fireEvent.change(screen.getByLabelText("Role name"), { target: { value: "Reviewer minus" } });

    expect(screen.getByRole("button", { name: "Create custom role" })).toBeEnabled();
    expect(screen.queryByTestId("settings-roles-create-readiness")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("blocks seeding from a built-in role that the matrix could not load", async () => {
    stubRolesResponse([rolesWithCustomColumn[1]]);

    render(<SettingsRolesMatrixSection />);

    await screen.findByTestId("settings-roles-builtin-summary");

    fireEvent.change(screen.getByLabelText("Role name"), { target: { value: "Reviewer minus" } });

    // Default start-from is Operator/Architect, which is absent from this payload.
    expect(screen.getByTestId("settings-roles-create-readiness")).toHaveTextContent(/Architect could not be loaded/i);
    expect(screen.getByRole("button", { name: "Create custom role" })).toBeDisabled();

    vi.unstubAllGlobals();
  });

  it("shows a retryable inline error instead of an empty matrix when roles cannot be loaded", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsRolesMatrixSection />);

    const errorPanel = await screen.findByTestId("settings-roles-matrix-load-error");
    expect(errorPanel).toHaveTextContent(/could not load roles/i);
    expect(errorPanel).not.toHaveTextContent(/503/);
    expect(screen.queryByTestId("settings-roles-matrix")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);

    vi.unstubAllGlobals();
  });
});
