import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readOperatorWorkingCareerRehearsalDoor,
  writeOperatorWorkingCareerRehearsalDoor,
} from "@/lib/governance/operator-working-career-rehearsal-door-persistence";
import { LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY } from "@/lib/governance/local-dev-record-startup";
import { WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY } from "@/lib/governance/working-career-rehearsal-door";

const devOverridesMock = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/lib/dev-testing-overrides", () => ({
  isDevTestingOverridesEnabled: () => devOverridesMock.enabled,
}));

describe("operator-working-career-rehearsal-door-persistence", () => {
  beforeEach(() => {
    devOverridesMock.enabled = false;
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    devOverridesMock.enabled = false;
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("uses tenant localStorage outside local dev", () => {
    writeOperatorWorkingCareerRehearsalDoor({ kind: "tenant" }, "rehearsal");

    expect(window.localStorage.getItem(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY)).toBe("rehearsal");
    expect(readOperatorWorkingCareerRehearsalDoor({ kind: "tenant" })).toBe("rehearsal");
    expect(window.sessionStorage.getItem(LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("defaults to Record and keeps Practice in sessionStorage during local dev", () => {
    devOverridesMock.enabled = true;
    window.localStorage.setItem(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY, "rehearsal");

    expect(readOperatorWorkingCareerRehearsalDoor({ kind: "tenant" })).toBe("career");

    writeOperatorWorkingCareerRehearsalDoor({ kind: "tenant" }, "rehearsal");

    expect(window.sessionStorage.getItem(LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY)).toBe("rehearsal");
    expect(window.localStorage.getItem(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY)).toBe("rehearsal");
    expect(readOperatorWorkingCareerRehearsalDoor({ kind: "tenant" })).toBe("rehearsal");

    writeOperatorWorkingCareerRehearsalDoor({ kind: "tenant" }, "career");

    expect(window.sessionStorage.getItem(LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(readOperatorWorkingCareerRehearsalDoor({ kind: "tenant" })).toBe("career");
  });
});
