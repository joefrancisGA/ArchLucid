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
});
