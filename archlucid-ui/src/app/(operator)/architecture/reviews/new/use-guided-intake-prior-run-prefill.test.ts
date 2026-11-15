import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ScopeUnderstandingBullet } from "@/lib/architecture/architecture-scope-understanding-check";

const { getRunDetail, tryLoadPriorPackageGuidedIntakePrefill } = vi.hoisted(() => ({
  getRunDetail: vi.fn(),
  tryLoadPriorPackageGuidedIntakePrefill: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ getRunDetail, getArchitectureRequest: vi.fn() }));

vi.mock("@/lib/try-load-prior-package-guided-intake-prefill", () => ({
  tryLoadPriorPackageGuidedIntakePrefill,
}));

import {
  GUIDED_INTAKE_PRIOR_RUN_PREFILL_LOAD_FAILED_LINE,
  useGuidedIntakePriorRunPrefill,
} from "./use-guided-intake-prior-run-prefill";

const existingScopeBullet: ScopeUnderstandingBullet = {
  id: "scope-1",
  kind: "custom",
  label: "",
  value: "Operator-edited scope",
  source: "user",
};

const priorPackagePrefill = {
  systemName: "Claims platform",
  freeTextIntent: "Review claims platform architecture.",
  businessOutcome: "Reduce claims processing time.",
  actorSet: { actors: [] },
  scopeBullets: [existingScopeBullet],
  scopeGateOpen: true,
  priorAttachedFileNames: [],
};

describe("useGuidedIntakePriorRunPrefill", () => {
  it("does not overwrite scope edits made while prior-package loading is in flight", async () => {
    let resolvePrefill: ((value: typeof priorPackagePrefill) => void) | undefined;
    tryLoadPriorPackageGuidedIntakePrefill.mockReturnValueOnce(
      new Promise<typeof priorPackagePrefill>((resolve) => {
        resolvePrefill = resolve;
      }),
    );
    const setScopeBullets = vi.fn();
    const setScopeGateOpen = vi.fn();
    const initialProps = {
      priorRunId: "run-1",
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "",
      actorSet: { actors: [] },
      scopeBullets: [] as readonly ScopeUnderstandingBullet[],
      setFreeTextIntent: vi.fn(),
      setBusinessOutcome: vi.fn(),
      setSystemName: vi.fn(),
      setActorSet: vi.fn(),
      setScopeBullets,
      setScopeGateOpen,
      setPriorAttachedFileNames: vi.fn(),
    };
    const { rerender } = renderHook(
      (props) => useGuidedIntakePriorRunPrefill(props),
      { initialProps },
    );

    rerender({ ...initialProps, scopeBullets: [existingScopeBullet] });

    await act(async () => {
      resolvePrefill?.(priorPackagePrefill);
    });

    expect(setScopeBullets).not.toHaveBeenCalled();
    expect(setScopeGateOpen).not.toHaveBeenCalled();
  });

  it("reports a prior-package API failure without changing intake fields", async () => {
    const loader = await vi.importActual<typeof import("@/lib/try-load-prior-package-guided-intake-prefill")>(
      "@/lib/try-load-prior-package-guided-intake-prefill",
    );
    getRunDetail.mockRejectedValueOnce(new Error("Prior run request failed"));
    tryLoadPriorPackageGuidedIntakePrefill.mockImplementationOnce(loader.tryLoadPriorPackageGuidedIntakePrefill);
    const setSystemName = vi.fn();

    const { result } = renderHook(() =>
      useGuidedIntakePriorRunPrefill({
        priorRunId: "run-1",
        freeTextIntent: "",
        businessOutcome: "",
        systemName: "",
        actorSet: { actors: [] },
        scopeBullets: [],
        setFreeTextIntent: vi.fn(),
        setBusinessOutcome: vi.fn(),
        setSystemName,
        setActorSet: vi.fn(),
        setScopeBullets: vi.fn(),
        setScopeGateOpen: vi.fn(),
        setPriorAttachedFileNames: vi.fn(),
      }),
    );

    await waitFor(() => expect(result.current.priorRunPrefillCopiedFromLine)
      .toBe(GUIDED_INTAKE_PRIOR_RUN_PREFILL_LOAD_FAILED_LINE));
    expect(getRunDetail).toHaveBeenCalledWith("run-1");
    expect(setSystemName).not.toHaveBeenCalled();
  });
});
