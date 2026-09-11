import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const runStatusVocabularyPassForced = vi.hoisted(() => ({ on: null as boolean | null }));
const workingDeskMock = vi.hoisted(() => ({ value: false }));
const effectiveDoorMock = vi.hoisted(() => ({ value: "career" as "career" | "rehearsal" }));

vi.mock("@/hooks/use-effective-working-career-rehearsal-door", () => ({
  useEffectiveWorkingCareerRehearsalDoor: () => ({
    door: effectiveDoorMock.value,
    effectiveDoor: effectiveDoorMock.value,
    mounted: true,
  }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => workingDeskMock.value,
}));

vi.mock("@/hooks/use-health-ready-summary-query", () => ({
  useHealthReadySummaryQuery: () => ({
    data: undefined,
    isPending: false,
    isSuccess: false,
  }),
}));

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
import { WorkingCareerRehearsalIntentProvider } from "@/components/governance/WorkingCareerRehearsalIntentProvider";
import type { RunSummary } from "@/types/authority";

function renderRunStatusBadge(run: RunSummary, finalizeHonesty?: Parameters<typeof RunStatusBadge>[0]["finalizeHonesty"]) {
  return render(
    <WorkingCareerRehearsalIntentProvider>
      <RunStatusBadge run={run} finalizeHonesty={finalizeHonesty} />
    </WorkingCareerRehearsalIntentProvider>,
  );
}

const base: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000001",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
};

afterEach(() => {
  runStatusVocabularyPassForced.on = null;
  workingDeskMock.value = false;
  effectiveDoorMock.value = "career";
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

  it("suppresses Ready to finalize when transparency trail would block sealing (FC-70)", () => {
    expect(
      deriveRunListPipelineLabel(
        {
          ...base,
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
        },
        {
          transparencyTrail: {
            asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
            inferred: [],
            skipped: [{ questionKey: "drRpo", tier: "Must" }],
          },
        },
      ),
    ).toBe("In pipeline");
  });

  it("suppresses Ready to finalize on Working Rehearsal door (AS-079)", () => {
    expect(
      deriveRunListPipelineLabel(
        {
          ...base,
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
          structuralExecutionMode: "Real",
        },
        {
          workingDesk: true,
          effectiveWorkingCareerRehearsalDoor: "rehearsal",
        },
      ),
    ).toBe("In pipeline");
  });

  it("keeps rehearsal honesty when the execute stamp is Rehearsal and the live chooser moved to Career (CG-019)", () => {
    expect(
      deriveRunListPipelineLabel(
        {
          ...base,
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
          structuralExecutionMode: "Real",
          workingCareerRehearsalDoor: "rehearsal",
        },
        {
          workingDesk: true,
          effectiveWorkingCareerRehearsalDoor: "career",
        },
      ),
    ).toBe("In pipeline");
  });

  it("suppresses Ready to finalize when pre-finalize gate is disabled on Working (LP-18)", () => {
    expect(
      deriveRunListPipelineLabel(
        {
          ...base,
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
        },
        {
          workingDesk: true,
          preCommitGateEnabled: false,
        },
      ),
    ).toBe("In pipeline");
  });

  it("suppresses Ready to finalize for Working Rehearsal intent (AS-079)", () => {
    expect(
      deriveRunListPipelineLabel(
        {
          ...base,
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
          structuralExecutionMode: 1,
        },
        {
          workingDesk: true,
          workingCareerRehearsalIntent: "rehearsal",
        },
      ),
    ).toBe("In pipeline");
  });
});

describe("RunStatusBadge", () => {
  it("exposes canonical review status in aria-label when vocabulary pass is active", () => {
    runStatusVocabularyPassForced.on = true;

    renderRunStatusBadge({ ...base, hasGoldenManifest: true });

    expect(screen.getByLabelText(/Review status: Ready/i)).toBeInTheDocument();
  });

  it("delegates styling to the canonical approved StatusTag (Ready label)", () => {
    runStatusVocabularyPassForced.on = true;

    const { container } = renderRunStatusBadge({ ...base, hasGoldenManifest: true });
    const pill = container.querySelector('[aria-label="Review status: Ready"]');

    expect(pill).not.toBeNull();
    expect(pill?.className).toContain("bg-[var(--al-status-ready-bg)]");
    expect(pill?.className).toContain("text-[var(--al-status-ready-fg)]");
  });

  it("shows engineering pipeline labels when vocabulary pass is off", () => {
    runStatusVocabularyPassForced.on = false;

    renderRunStatusBadge({ ...base, hasGoldenManifest: true });

    expect(
      screen.getByLabelText(/Architecture review pipeline status: Finalized/i),
    ).toBeInTheDocument();
  });

  it("maps ready-to-finalize internal state to Needs attention when vocabulary pass is on", () => {
    runStatusVocabularyPassForced.on = true;

    renderRunStatusBadge(
      {
        ...base,
        hasFindingsSnapshot: true,
        hasGoldenManifest: false,
      },
    );

    expect(screen.getByLabelText(/Review status: Needs attention/i)).toBeInTheDocument();
  });

  it("shows Career blocked on Working finalized Career + Simulator (CG-031)", () => {
    runStatusVocabularyPassForced.on = true;
    workingDeskMock.value = true;
    effectiveDoorMock.value = "career";

    const { container } = renderRunStatusBadge({
      ...base,
      hasGoldenManifest: true,
      structuralExecutionMode: "Simulator",
    });

    expect(screen.getByLabelText(/Review status: Career blocked/i)).toBeInTheDocument();
    const pill = container.querySelector('[aria-label="Review status: Career blocked"]');
    expect(pill?.className).not.toContain("bg-[var(--al-status-ready-bg)]");
    expect(pill?.className).toContain("bg-[var(--al-status-blocked-bg)]");
  });

  it("shows Rehearsal incomplete on Working finalized Rehearsal + Simulator (CG-031)", () => {
    runStatusVocabularyPassForced.on = true;
    workingDeskMock.value = true;
    effectiveDoorMock.value = "rehearsal";

    const { container } = renderRunStatusBadge({
      ...base,
      hasGoldenManifest: true,
      structuralExecutionMode: "Simulator",
    });

    expect(screen.getByLabelText(/Review status: Rehearsal incomplete/i)).toBeInTheDocument();
    const pill = container.querySelector('[aria-label="Review status: Rehearsal incomplete"]');
    expect(pill?.className).not.toContain("bg-[var(--al-status-ready-bg)]");
  });

  it("shows Practice on Working finalized Rehearsal + Real (CG-031)", () => {
    runStatusVocabularyPassForced.on = true;
    workingDeskMock.value = true;
    effectiveDoorMock.value = "rehearsal";

    renderRunStatusBadge({
      ...base,
      hasGoldenManifest: true,
      structuralExecutionMode: "Real",
    });

    expect(screen.getByLabelText(/Review status: Practice/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Review status: Ready/i)).not.toBeInTheDocument();
  });

  it("keeps Ready on Working finalized Career + Real (CG-031)", () => {
    runStatusVocabularyPassForced.on = true;
    workingDeskMock.value = true;
    effectiveDoorMock.value = "career";

    renderRunStatusBadge({
      ...base,
      hasGoldenManifest: true,
      structuralExecutionMode: "Real",
    });

    expect(screen.getByLabelText(/Review status: Ready/i)).toBeInTheDocument();
  });
});
