import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorSavedViewsBar } from "@/components/operator/OperatorSavedViewsBar";

const navigationMocks = vi.hoisted(() => {
  const searchParams = new URLSearchParams();

  return {
    searchParams,
    replace: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
  usePathname: () => "/governance/audit",
  useSearchParams: () => navigationMocks.searchParams,
}));

const listOperatorSavedViews = vi.fn();
const createOperatorSavedView = vi.fn();
const deleteOperatorSavedView = vi.fn();

vi.mock("@/lib/api/operator-saved-views", () => ({
  listOperatorSavedViews: (...args: unknown[]) => listOperatorSavedViews(...args),
  createOperatorSavedView: (...args: unknown[]) => createOperatorSavedView(...args),
  deleteOperatorSavedView: (...args: unknown[]) => deleteOperatorSavedView(...args),
}));

describe("OperatorSavedViewsBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.searchParams = new URLSearchParams();
    listOperatorSavedViews.mockResolvedValue([
      {
        id: "view-1",
        name: "Daily audit",
        surface: "audit",
        isShared: false,
        isOwnedByCurrentUser: true,
        payload: {},
      },
    ]);
    deleteOperatorSavedView.mockResolvedValue(undefined);
  });

  it("keeps Save view disabled until at least two characters are entered", async () => {
    createOperatorSavedView.mockResolvedValue({
      id: "view-new",
      name: "My view",
      surface: "audit",
      isShared: false,
      isOwnedByCurrentUser: true,
      payload: {},
    });

    render(
      <OperatorSavedViewsBar
        surface="audit"
        getCurrentPayload={() => ({})}
        onLoadView={async () => undefined}
      />,
    );

    const saveButton = await screen.findByTestId("operator-saved-views-save-audit");
    const nameInput = screen.getByLabelText(/Name for new audit saved view/i);

    expect(saveButton).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: "A" } });
    expect(saveButton).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: "AB" } });
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createOperatorSavedView).toHaveBeenCalledWith({
        surface: "audit",
        name: "AB",
        payload: {},
        isShared: false,
      });
    });
  });

  it("requires confirmation before deleting a saved view", async () => {
    render(
      <OperatorSavedViewsBar
        surface="audit"
        getCurrentPayload={() => ({})}
        onLoadView={async () => undefined}
      />,
    );

    const select = await screen.findByLabelText(/Load saved audit view/i);
    fireEvent.change(select, { target: { value: "view-1" } });

    const deleteButton = screen.getByTestId("operator-saved-views-delete-audit");
    await waitFor(() => {
      expect(deleteButton).toBeEnabled();
    });

    fireEvent.click(deleteButton);

    expect(screen.getByRole("heading", { name: /Delete saved view/i })).toBeInTheDocument();
    expect(deleteOperatorSavedView).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete view" }));

    await waitFor(() => {
      expect(deleteOperatorSavedView).toHaveBeenCalledWith("view-1");
    });
  });
});
