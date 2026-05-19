import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const runStatusBuyerPolishedForced = vi.hoisted(() => ({ on: false as boolean }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () =>
      runStatusBuyerPolishedForced.on === true ? true : actual.isBuyerPolishedOperatorShellEnv(),
  };
});

import { RunStatusBadge, deriveRunListPipelineLabel } from "@/components/RunStatusBadge";
import type { RunSummary } from "@/types/authority";

const base: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000001",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
};

afterEach(() => {
  runStatusBuyerPolishedForced.on = false;
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
  it("exposes pipeline status in aria-label via StatusPill", () => {
    render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);

    expect(screen.getByLabelText(/Architecture review pipeline status: Finalized/i)).toBeInTheDocument();
  });

  it("delegates to StatusPill pipeline domain (Finalized styling)", () => {
    const { container } = render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);
    const pill = container.querySelector('[aria-label="Architecture review pipeline status: Finalized"]');

    expect(pill).not.toBeNull();
    expect(pill?.className).toMatch(/rounded-full/);
    expect(pill?.className).toMatch(/emerald-9/);
  });

  it("uses buyer-facing pipeline labels when buyer-polished shell is active", () => {
    runStatusBuyerPolishedForced.on = true;

    render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);

    expect(screen.getByLabelText(/Architecture review pipeline status: Package finalized/i)).toBeInTheDocument();
  });

  it("keeps emerald styling for buyer Package finalized label", () => {
    runStatusBuyerPolishedForced.on = true;

    const { container } = render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);
    const pill = container.querySelector('[aria-label="Architecture review pipeline status: Package finalized"]');

    expect(pill?.className).toMatch(/emerald-9/);
  });
});
