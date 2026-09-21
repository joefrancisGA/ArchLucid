import { beforeEach, describe, expect, it, vi } from "vitest";

const returnToDedicatedWorkspaceFromSample = vi.hoisted(() => vi.fn(() => true));
const bootstrapDedicatedWorkspaceScope = vi.hoisted(() => vi.fn(async () => false));
const setUserFirstSessionPurpose = vi.hoisted(() => vi.fn(async () => undefined));
const setUserWorkspaceMode = vi.hoisted(() => vi.fn(async () => undefined));
const setUserWorkingCareerRehearsalDoor = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/operator/operator-scope-bootstrap", () => ({
  returnToDedicatedWorkspaceFromSample,
  bootstrapDedicatedWorkspaceScope,
}));

vi.mock("@/lib/api/user-preferences", () => ({
  setUserFirstSessionPurpose,
  setUserWorkspaceMode,
  setUserWorkingCareerRehearsalDoor,
}));

import { exitLiveSeatTraining } from "@/lib/auth/exit-live-seat-training";

describe("exitLiveSeatTraining (LS-014)", () => {
  beforeEach(() => {
    returnToDedicatedWorkspaceFromSample.mockReset();
    returnToDedicatedWorkspaceFromSample.mockReturnValue(true);
    bootstrapDedicatedWorkspaceScope.mockReset();
    bootstrapDedicatedWorkspaceScope.mockResolvedValue(false);
    setUserFirstSessionPurpose.mockClear();
    setUserWorkspaceMode.mockClear();
    setUserWorkingCareerRehearsalDoor.mockClear();
  });

  it("restores dedicated scope and persists live Working Record preferences", async () => {
    const ok = await exitLiveSeatTraining();

    expect(ok).toBe(true);
    expect(returnToDedicatedWorkspaceFromSample).toHaveBeenCalledTimes(1);
    expect(bootstrapDedicatedWorkspaceScope).not.toHaveBeenCalled();
    expect(setUserFirstSessionPurpose).toHaveBeenCalledWith("live");
    expect(setUserWorkspaceMode).toHaveBeenCalledWith("working");
    expect(setUserWorkingCareerRehearsalDoor).toHaveBeenCalledWith("career");
  });

  it("bootstraps when dedicated storage is missing", async () => {
    returnToDedicatedWorkspaceFromSample.mockReturnValue(false);
    bootstrapDedicatedWorkspaceScope.mockResolvedValue(true);

    const ok = await exitLiveSeatTraining();

    expect(ok).toBe(true);
    expect(bootstrapDedicatedWorkspaceScope).toHaveBeenCalledTimes(1);
    expect(setUserFirstSessionPurpose).toHaveBeenCalledWith("live");
  });

  it("returns false when scope cannot be restored", async () => {
    returnToDedicatedWorkspaceFromSample.mockReturnValue(false);
    bootstrapDedicatedWorkspaceScope.mockResolvedValue(false);

    const ok = await exitLiveSeatTraining();

    expect(ok).toBe(false);
    expect(setUserFirstSessionPurpose).not.toHaveBeenCalled();
  });
});
