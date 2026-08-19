import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { triggerGoldenManifestMarkdownDownload } from "@/lib/export-markdown";

import { CopyForAiAssistantButton } from "./CopyForAiAssistantButton";

vi.mock("@/lib/export-markdown", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/export-markdown")>();

  return {
    ...actual,
    triggerGoldenManifestMarkdownDownload: vi.fn(),
  };
});

const mockDownload = vi.mocked(triggerGoldenManifestMarkdownDownload);

const usableManifest = { runId: "run-42", manifestId: "m-42", systemName: "Claims API" };

const defaultProps = {
  goldenManifestJson: usableManifest,
  manifestSummary: null,
  runId: "run-42",
} as const;

describe("CopyForAiAssistantButton", () => {
  beforeEach(() => {
    mockDownload.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders null when goldenManifestJson is not usable", () => {
    const { container } = render(
      <CopyForAiAssistantButton {...defaultProps} goldenManifestJson={{ demo: true }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("copies to clipboard and shows Copied feedback on success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyForAiAssistantButton {...defaultProps} />);

    fireEvent.click(screen.getByTestId("copy-for-ai-assistant-button"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });

    expect(writeText.mock.calls[0]?.[0]).toContain("run-42");
    expect(screen.getByTestId("copy-for-ai-assistant-button")).toHaveTextContent("Copied");
  });

  it("falls back to download and shows Downloaded when clipboard throws", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyForAiAssistantButton {...defaultProps} />);

    fireEvent.click(screen.getByTestId("copy-for-ai-assistant-button"));

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId("copy-for-ai-assistant-button")).toHaveTextContent("Downloaded");
  });

  it("returns to original label after 1.5 s", async () => {
    vi.useFakeTimers();

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyForAiAssistantButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-for-ai-assistant-button"));
      await Promise.resolve();
    });

    expect(screen.getByTestId("copy-for-ai-assistant-button")).toHaveTextContent("Copied");

    await act(async () => {
      vi.advanceTimersByTime(1_500);
    });

    expect(screen.getByTestId("copy-for-ai-assistant-button")).toHaveTextContent("Copy for AI assistant");
  });
});
