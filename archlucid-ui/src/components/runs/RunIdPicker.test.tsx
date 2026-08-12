import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: vi.fn(),
  listRunsInScopePaged: vi.fn(),
  shouldListReviewsAcrossProjectSlugs: vi.fn((projectId: string | null | undefined) => {
    const trimmed = projectId?.trim() ?? "";

    return trimmed.length === 0 || trimmed.toLowerCase() === "default";
  }),
}));

import { listRunsInScopePaged } from "@/lib/api";

import { RunIdPicker } from "@/components/runs/RunIdPicker";

const mockListInScope = vi.mocked(listRunsInScopePaged);

describe("RunIdPicker", () => {
  it("loads runs on focus", async () => {
    mockListInScope.mockResolvedValue({
      items: [
        {
          runId: "11111111-1111-1111-1111-111111111111",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00.000Z",
          description: "Alpha run",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const onChange = vi.fn();
    render(
      <RunIdPicker preferAutoPick={false} value="" onChange={onChange} label="Review" placeholder="Review ID" />,
    );

    fireEvent.focus(screen.getByPlaceholderText("Review ID"));

    await waitFor(() => {
      expect(mockListInScope).toHaveBeenCalledWith(1, 50);
    });
  });

  it("selecting a suggestion sets the run id", async () => {
    mockListInScope.mockResolvedValue({
      items: [
        {
          runId: "22222222-2222-2222-2222-222222222222",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00.000Z",
          description: "Beta",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const onChange = vi.fn();
    render(
      <RunIdPicker preferAutoPick={false} value="" onChange={onChange} label="Review" placeholder="Pick" />,
    );

    fireEvent.focus(screen.getByPlaceholderText("Pick"));

    const option = await screen.findByRole("option", { name: /22222222/i });
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("22222222-2222-2222-2222-222222222222");
  });

  it("opens the list again when clicking the input after picking an option (input stays focused)", async () => {
    mockListInScope.mockResolvedValue({
      items: [
        {
          runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00.000Z",
          description: "First row",
        },
        {
          runId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00.000Z",
          description: "Second row",
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const onChange = vi.fn();
    render(
      <RunIdPicker
        preferAutoPick={false}
        value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        onChange={onChange}
        label="Review"
        placeholder="Pick"
        useBuyerFacingRunLabels
      />,
    );

    const input = screen.getByPlaceholderText("Pick");

    fireEvent.focus(input);

    const second = await screen.findByRole("option", { name: /Second row/i });

    fireEvent.click(second);

    await waitFor(() => {
      expect(screen.queryByRole("option", { name: /Second row/i })).not.toBeInTheDocument();
    });

    fireEvent.click(input);

    expect(await screen.findByRole("option", { name: /Second row/i })).toBeInTheDocument();
  });

  it("filters buyer-facing titles and supports keyboard selection", async () => {
    const runs = Array.from({ length: 15 }, (_, index) => ({
      runId: `run-${String(index).padStart(2, "0")}`,
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00.000Z",
      description: `Review title ${index}`,
    }));

    mockListInScope.mockResolvedValue({
      items: runs,
      totalCount: runs.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    let currentValue = "";
    const onChange = vi.fn((next: string) => {
      currentValue = next;
    });

    const { rerender } = render(
      <RunIdPicker
        preferAutoPick={false}
        value={currentValue}
        onChange={onChange}
        label="Review"
        placeholder="Pick"
        useBuyerFacingRunLabels
      />,
    );

    const input = screen.getByPlaceholderText("Pick");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Review title 14" } });
    rerender(
      <RunIdPicker
        preferAutoPick={false}
        value={currentValue}
        onChange={onChange}
        label="Review"
        placeholder="Pick"
        useBuyerFacingRunLabels
      />,
    );

    await screen.findByRole("option", { name: /Review title 14/i });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenLastCalledWith("run-14");
  });
});
