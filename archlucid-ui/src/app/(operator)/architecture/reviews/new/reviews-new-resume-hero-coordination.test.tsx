import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewsNewWizardResumeStrip } from "@/components/usability/ReviewsNewWizardResumeStrip";
import {
  WIZARD_SESSION_IDS,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

const searchParamsGet = vi.fn<(key: string) => string | null>();
const workspaceModeMock = vi.hoisted(() => ({ value: "guided" as "guided" | "working" }));
const buyerPolishedShellMock = vi.hoisted(() => ({ value: true }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
    }),
    usePathname: () => "/architecture/reviews/new",
    useSearchParams: () => ({
      get: (key: string) => searchParamsGet(key),
    }),
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => buyerPolishedShellMock.value,
  };
});

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();

  return {
    ...actual,
    useWorkspaceModeOrDefault: () => workspaceModeMock.value,
    useWorkspaceMode: () => ({
      mode: workspaceModeMock.value,
      mounted: true,
      accountSyncState: "synced" as const,
      isWorkingMode: workspaceModeMock.value === "working",
      setAndPersist: vi.fn(),
    }),
  };
});

import { FirstPilotIntakeWizard } from "./FirstPilotIntakeWizard";
import { ReviewsNewPageShell } from "./ReviewsNewPageShell";

describe("reviews-new resume hero coordination", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    searchParamsGet.mockImplementation(() => null);
    workspaceModeMock.value = "guided";
    buyerPolishedShellMock.value = true;
  });

  it("renders only the hub resume strip when both hub and wizard would resume the same session", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    render(
      <ReviewsNewPageShell>
        <FirstPilotIntakeWizard />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByTestId("reviews-new-wizard-resume-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("wizard-session-resume-prompt")).not.toBeInTheDocument();
  });

  it("hides the hub resume strip on detailed path tabs", () => {
    searchParamsGet.mockImplementation((key: string) => (key === "path" ? "detailed" : null));

    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewTemplates, {
      stepIndex: 1,
      state: { systemName: "Core platform", description: "" },
    });

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.queryByTestId("reviews-new-wizard-resume-strip")).not.toBeInTheDocument();
  });

  it("suppresses the vocabulary rail on the working desk", () => {
    workspaceModeMock.value = "working";
    buyerPolishedShellMock.value = false;

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.queryByTestId("path-chooser-create-object-vocabulary")).not.toBeInTheDocument();
  });

  it("renders the vocabulary rail for eval chrome outside path tabs", () => {
    buyerPolishedShellMock.value = false;

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByTestId("path-chooser-create-object-vocabulary")).toBeInTheDocument();
  });
});
