import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { RunStatusBadge, deriveRunListPipelineLabel } from "@/components/RunStatusBadge";
import type { RunSummary } from "@/types/authority";

const base: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000001",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
};

afterEach(() => {
  buyerPolishedShellVitestOverride.value = null;
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
  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = false;
  });

  it("exposes pipeline status in aria-label via StatusPill", () => {
    render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);

    expect(screen.getByLabelText(/Architecture review pipeline status: Finalized/i)).toBeInTheDocument();
  });

  it("delegates to StatusPill pipeline domain (Finalized styling)", () => {
    const { container } = render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);
    const pill = container.querySelector('[aria-label="Architecture review pipeline status: Finalized"]');

    expect(pill).not.toBeNull();
    expect(pill?.className).toMatch(/rounded/);
    expect(pill?.className).toMatch(/--al-status-ready-bg/);
  });

  it("uses buyer-facing pipeline labels when buyer-polished shell is active", () => {
    buyerPolishedShellVitestOverride.value = true;

    render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);

    expect(screen.getByLabelText(/Architecture review pipeline status: Package finalized/i)).toBeInTheDocument();
  });

  it("keeps ready styling for buyer Package finalized label", () => {
    buyerPolishedShellVitestOverride.value = true;

    const { container } = render(<RunStatusBadge run={{ ...base, hasGoldenManifest: true }} />);
    const pill = container.querySelector('[aria-label="Architecture review pipeline status: Package finalized"]');

    expect(pill?.className).toMatch(/--al-status-ready-bg/);
  });
});
