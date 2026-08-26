import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewsNewWizardResumeStrip } from "@/components/usability/ReviewsNewWizardResumeStrip";
import {
  WIZARD_SESSION_IDS,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

const searchParamsGet = vi.fn<(key: string) => string | null>();

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
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

import { FirstPilotIntakeWizard } from "./FirstPilotIntakeWizard";
import { ReviewsNewPageChrome } from "./ReviewsNewPageChrome";

describe("reviews-new resume hero coordination", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    searchParamsGet.mockImplementation(() => null);
  });

  it("renders only the hub resume strip when both hub and wizard would resume the same session", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    render(
      <>
        <ReviewsNewPageChrome />
        <FirstPilotIntakeWizard />
      </>,
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

    render(<ReviewsNewPageChrome />);

    expect(screen.queryByTestId("reviews-new-wizard-resume-strip")).not.toBeInTheDocument();
  });
});
