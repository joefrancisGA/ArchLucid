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
    expect(screen.getByRole("button", { name: "Clone Architect role" })).toBeInTheDocument();

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
});
