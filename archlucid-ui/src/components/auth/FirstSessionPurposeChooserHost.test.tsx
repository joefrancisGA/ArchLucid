import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const visitSampleWorkspaceScope = vi.hoisted(() => vi.fn());
const bootstrapDedicatedWorkspaceScope = vi.hoisted(() => vi.fn(async () => true));
const setUserFirstSessionPurpose = vi.hoisted(() => vi.fn(async () => undefined));
const setUserWorkspaceMode = vi.hoisted(() => vi.fn(async () => undefined));
const setUserWorkingCareerRehearsalDoor = vi.hoisted(() => vi.fn(async () => undefined));
const setAndPersist = vi.hoisted(() => vi.fn());

const preferencesMock = vi.hoisted(() => ({
  data: undefined as
    | {
        firstSessionPurposeIsExplicit: boolean;
        firstSessionPurpose: "live" | "training" | null;
      }
    | undefined,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => preferencesMock,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => true,
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

vi.mock("@/lib/operator/operator-scope-actions", () => ({
  visitSampleWorkspaceScope,
}));

vi.mock("@/lib/operator/operator-scope-bootstrap", () => ({
  bootstrapDedicatedWorkspaceScope,
}));

vi.mock("@/lib/operator/operator-sample-workspace-visit", () => ({
  isSampleWorkspaceVisitActive: () => false,
}));

vi.mock("@/lib/api/user-preferences", () => ({
  fetchUserPreferencesFromApi: vi.fn(),
  setUserFirstSessionPurpose,
  setUserWorkspaceMode,
  setUserWorkingCareerRehearsalDoor,
  USER_PREFERENCES_STALE_MS: 60_000,
}));

vi.mock("@/lib/auth/first-session-purpose-grandfather", () => ({
  shouldGrandfatherFirstSessionPurposeAsLive: () => false,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ setAndPersist }),
}));

vi.mock("@/components/auth/FirstSessionPurposeChooser", () => ({
  FirstSessionPurposeChooser: () => null,
}));

import { FirstSessionPurposeChooserHost } from "@/components/auth/FirstSessionPurposeChooserHost";

describe("FirstSessionPurposeChooserHost (LS-011)", () => {
  beforeEach(() => {
    visitSampleWorkspaceScope.mockClear();
    bootstrapDedicatedWorkspaceScope.mockClear();
    setUserFirstSessionPurpose.mockClear();
    setUserWorkspaceMode.mockClear();
    setAndPersist.mockClear();
    preferencesMock.data = undefined;
  });

  it("replays Training sample visit when purpose is training and visit flag is cleared", async () => {
    preferencesMock.data = {
      firstSessionPurposeIsExplicit: true,
      firstSessionPurpose: "training",
    };

    render(<FirstSessionPurposeChooserHost />);

    await waitFor(() => {
      expect(setAndPersist).toHaveBeenCalledWith("guided");
      expect(visitSampleWorkspaceScope).toHaveBeenCalledTimes(1);
    });
    expect(bootstrapDedicatedWorkspaceScope).not.toHaveBeenCalled();
  });

  it("bootstraps dedicated scope when purpose is live", async () => {
    preferencesMock.data = {
      firstSessionPurposeIsExplicit: true,
      firstSessionPurpose: "live",
    };

    render(<FirstSessionPurposeChooserHost />);

    await waitFor(() => {
      expect(bootstrapDedicatedWorkspaceScope).toHaveBeenCalledTimes(1);
    });
    expect(visitSampleWorkspaceScope).not.toHaveBeenCalled();
  });
});
