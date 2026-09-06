import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureIdentityRenameForm } from "@/components/architecture/ArchitectureIdentityRenameForm";

const patchArchitectureIdentityMock = vi.fn();

vi.mock("@/lib/api/architecture-identity-api", () => ({
  patchArchitectureIdentity: (...args: unknown[]) => patchArchitectureIdentityMock(...args),
}));

function renderWithQuery(ui: React.JSX.Element): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("ArchitectureIdentityRenameForm (CA-31 Working fixture)", () => {
  it("disables save until the name is non-empty and changed", () => {
    renderWithQuery(
      <ArchitectureIdentityRenameForm architectureId="architecture-identity-001" displayName="Payments platform" />,
    );

    const saveButton = screen.getByTestId("architecture-identity-rename-save");
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByTestId("architecture-identity-rename-input"), {
      target: { value: "Retail payments" },
    });

    expect(saveButton).toBeEnabled();
  });

  it("does not submit when the trimmed name is empty", () => {
    renderWithQuery(
      <ArchitectureIdentityRenameForm architectureId="architecture-identity-001" displayName="Payments platform" />,
    );

    fireEvent.change(screen.getByTestId("architecture-identity-rename-input"), {
      target: { value: "   " },
    });

    const saveButton = screen.getByTestId("architecture-identity-rename-save");
    expect(saveButton).toBeDisabled();

    fireEvent.click(saveButton);

    expect(patchArchitectureIdentityMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("architecture-identity-rename-field-error")).not.toBeInTheDocument();
  });

  it("submits a trimmed rename and calls onRenamed", async () => {
    patchArchitectureIdentityMock.mockResolvedValue({
      architectureId: "architecture-identity-001",
      displayName: "Retail payments",
    });

    const onRenamed = vi.fn();

    renderWithQuery(
      <ArchitectureIdentityRenameForm
        architectureId="architecture-identity-001"
        displayName="Payments platform"
        onRenamed={onRenamed}
      />,
    );

    fireEvent.change(screen.getByTestId("architecture-identity-rename-input"), {
      target: { value: "  Retail payments  " },
    });
    fireEvent.click(screen.getByTestId("architecture-identity-rename-save"));

    await vi.waitFor(() => {
      expect(patchArchitectureIdentityMock).toHaveBeenCalledWith("architecture-identity-001", {
        displayName: "Retail payments",
      });
    });

    expect(onRenamed).toHaveBeenCalledWith("Retail payments");
  });
});
