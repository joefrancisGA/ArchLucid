import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorSavedViewsBar } from "@/components/operator/OperatorSavedViewsBar";

const listOperatorSavedViews = vi.fn();
const deleteOperatorSavedView = vi.fn();

vi.mock("@/lib/api/operator-saved-views", () => ({
  listOperatorSavedViews: (...args: unknown[]) => listOperatorSavedViews(...args),
  createOperatorSavedView: vi.fn(),
  deleteOperatorSavedView: (...args: unknown[]) => deleteOperatorSavedView(...args),
}));

describe("OperatorSavedViewsBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    fireEvent.click(screen.getByTestId("operator-saved-views-delete-audit"));

    expect(screen.getByRole("heading", { name: /Delete saved view/i })).toBeInTheDocument();
    expect(deleteOperatorSavedView).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete view" }));

    await waitFor(() => {
      expect(deleteOperatorSavedView).toHaveBeenCalledWith("view-1");
    });
  });
});
