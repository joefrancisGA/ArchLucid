import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const runStatusVocabularyPassForced = vi.hoisted(() => ({ on: null as boolean | null }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerVocabularyPassActive: () =>
      runStatusVocabularyPassForced.on === null
        ? actual.isBuyerVocabularyPassActive()
        : runStatusVocabularyPassForced.on,
    isBuyerPolishedOperatorShellEnv: () =>
      runStatusVocabularyPassForced.on === null
        ? actual.isBuyerPolishedOperatorShellEnv()
        : runStatusVocabularyPassForced.on,
  };
});

import { RunStatusBadge, deriveRunListPipelineLabel } from "@/components/runs/RunStatusBadge";
import type { RunSummary } from "@/types/authority";

const base: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000001",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
};

afterEach(() => {
  runStatusVocabularyPassForced.on = null;
});

describe("deriveRunListPipelineLabel", () => {
  it("returns Finalized when golden manifest flag is true", () => {
    expect(deriveRunListPipelineLabel({ ...base, hasGoldenManifest: true })).toBe("Finalized");
  });

  it("returns Ready to finalize when findings present but no manifest", () => {
    expect(
      deriveRunListPipelineLabel({
        ...base,
        hasFindingsSnapshot: true,
        hasGoldenManifest: false,
      }),
    ).toBe("Ready to finalize");
  });
});

describe("RunStatusBadge", () => {
  it("exposes canonical review status in aria-label when vocabulary pass is active", () => {
    runStatusVocabularyPassForced.on = true;

    render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);

    expect(screen.getByLabelText(/Review status: Ready/i)).toBeInTheDocument();
  });

  it("delegates styling to the canonical approved StatusTag (Ready label)", () => {
    runStatusVocabularyPassForced.on = true;

    const { container } = render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);
    const pill = container.querySelector('[aria-label="Review status: Ready"]');

    expect(pill).not.toBeNull();
    expect(pill?.className).toContain("bg-[var(--al-status-approved-bg)]");
    expect(pill?.className).toContain("text-[var(--al-status-approved-fg)]");
  });

  it("shows engineering pipeline labels when vocabulary pass is off", () => {
    runStatusVocabularyPassForced.on = false;

    render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);

    expect(
      screen.getByLabelText(/Architecture review pipeline status: Finalized/i),
    ).toBeInTheDocument();
  });

  it("maps ready-to-finalize internal state to Needs attention when vocabulary pass is on", () => {
    runStatusVocabularyPassForced.on = true;

    render(
      <RunStatusBadge
        run={{
          ...base,
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
        }}
      />,
    );

    expect(screen.getByLabelText(/Review status: Needs attention/i)).toBeInTheDocument();
  });
});
