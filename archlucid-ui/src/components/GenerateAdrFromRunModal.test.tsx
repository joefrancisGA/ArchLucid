import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GenerateAdrFromRunModal } from "@/components/GenerateAdrFromRunModal";
import type { AdrGeneratorRunInput } from "@/lib/adr-from-run";

const minimalInput: AdrGeneratorRunInput = {
  runId: "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501",
  projectId: "p1",
  reviewTitle: "Test review",
  createdUtc: "2026-05-11T00:00:00.000Z",
  manifestStatusLabel: null,
  policyPackLabel: null,
  manifestCounts: null,
  explanation: null,
  findings: [],
};

describe("GenerateAdrFromRunModal", () => {
  it("opens with markdown seeded from input and supports reset", async () => {
    render(<GenerateAdrFromRunModal input={minimalInput} />);

    fireEvent.click(screen.getByTestId("generate-adr-button"));

    const dialog = await screen.findByRole("dialog");
    const editor = within(dialog).getByRole("textbox", { name: /architecture decision record markdown/i });
    const ta = editor as HTMLTextAreaElement;

    expect(ta.value).toContain("# ADR:");
    expect(ta.value).toContain(minimalInput.runId);

    fireEvent.change(editor, { target: { value: "edited" } });

    fireEvent.click(within(dialog).getByRole("button", { name: /reset to template/i }));

    expect(ta.value).not.toBe("edited");
    expect(ta.value).toContain("# ADR:");
  });

  it("copies markdown to clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<GenerateAdrFromRunModal input={minimalInput} />);

    fireEvent.click(screen.getByTestId("generate-adr-button"));
    fireEvent.click(await screen.findByRole("button", { name: /copy to clipboard/i }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain("# ADR:");
  });
});
