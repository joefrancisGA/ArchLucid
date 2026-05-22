import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: vi.fn(),
}));

import { listRunsByProjectPaged } from "@/lib/api";

import { RunIdPicker } from "./RunIdPicker";

const mockList = vi.mocked(listRunsByProjectPaged);

describe("RunIdPicker", () => {
  it("loads runs on focus", async () => {
    mockList.mockResolvedValue({
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
      expect(mockList).toHaveBeenCalledWith("default", 1, 50);
    });
  });

  it("selecting a suggestion sets the run id", async () => {
    mockList.mockResolvedValue({
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
    mockList.mockResolvedValue({
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
});
