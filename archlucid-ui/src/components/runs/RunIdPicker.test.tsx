import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunIdPicker } from "@/components/runs/RunIdPicker";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const loadProjectRunsMergedWithDemoFallbackMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

vi.mock("@/lib/operator/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: (...args: unknown[]) =>
    loadProjectRunsMergedWithDemoFallbackMock(...args),
}));

describe("RunIdPicker", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
    loadProjectRunsMergedWithDemoFallbackMock.mockReset();
  });

  it("loads runs on focus", async () => {
    loadProjectRunsMergedWithDemoFallbackMock.mockResolvedValue({
      items: [
        {
          runId: "11111111-1111-1111-1111-111111111111",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00.000Z",
          description: "Alpha run",
        },
      ],
      loadError: false,
    });

    const onChange = vi.fn();
    renderWithOperatorQuery(
      <RunIdPicker preferAutoPick={false} value="" onChange={onChange} label="Review" placeholder="Review ID" />,
    );

    fireEvent.focus(screen.getByPlaceholderText("Review ID"));

    await waitFor(() => {
      expect(loadProjectRunsMergedWithDemoFallbackMock).toHaveBeenCalled();
    });
  });

  it("selecting a suggestion sets the run id", async () => {
    loadProjectRunsMergedWithDemoFallbackMock.mockResolvedValue({
      items: [
        {
          runId: "22222222-2222-2222-2222-222222222222",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00.000Z",
          description: "Beta",
        },
      ],
      loadError: false,
    });

    const onChange = vi.fn();
    renderWithOperatorQuery(
      <RunIdPicker preferAutoPick={false} value="" onChange={onChange} label="Review" placeholder="Pick" />,
    );

    fireEvent.focus(screen.getByPlaceholderText("Pick"));

    const option = await screen.findByRole("option", { name: /22222222/i });
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("22222222-2222-2222-2222-222222222222");
  });

  it("opens the list again when clicking the input after picking an option (input stays focused)", async () => {
    loadProjectRunsMergedWithDemoFallbackMock.mockResolvedValue({
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
      loadError: false,
    });

    const onChange = vi.fn();
    renderWithOperatorQuery(
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

    loadProjectRunsMergedWithDemoFallbackMock.mockResolvedValue({
      items: runs,
      loadError: false,
    });

    let currentValue = "";
    const onChange = vi.fn((next: string) => {
      currentValue = next;
    });

    const { rerender } = renderWithOperatorQuery(
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
