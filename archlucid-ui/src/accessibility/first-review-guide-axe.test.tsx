import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { FirstReviewGuidePageClient } from "@/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuidePageClient";

expect.extend(toHaveNoViolations);

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/architecture/first-review-guide",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <button type="button">Help</button>,
}));

vi.mock("@/components/GettingStartedTrialSection", () => ({
  GettingStartedTrialSection: () => null,
}));

vi.mock("@/app/(operator)/architecture/first-review-guide/_sections/OnboardingOptionalSetupSection", () => ({
  OnboardingOptionalSetupSection: () => null,
}));

const prerequisitesCompleteGuideState = {
  hasLoadedContext: true,
  isPending: false,
  isError: false,
  errorMessage: null,
  retry: vi.fn(),
  onePrerequisite: null,
  readiness: {
    kind: "ready-to-start" as const,
    headline: "Ready to start",
    detail: "Optional workspace setup can be completed later.",
  },
  progress: {
    phase: "not-started" as const,
    progressFraction: 0,
    summaryLabel: "Not started",
    detailLabel: "Begin with step 1 when you are ready.",
    completedStepCount: 0,
    totalStepCount: 7,
  },
  steps: [
    {
      index: 0,
      title: "Define the architecture",
      explanation: "Describe the system, business goal, scope, and constraints.",
      status: "not-started" as const,
      statusLabel: "Not started",
      actionLabel: "Start review",
      actionHref: "/architecture/reviews/new",
      isNextStep: true,
    },
  ],
  headerActions: {
    primaryLabel: "Start first review",
    primaryHref: "/architecture/reviews/new",
    primaryDisabled: false,
    primaryDisabledReason: null,
    secondaryLabel: "Explore sample review",
    secondaryHref: "/architecture/reviews/sample",
  },
  requiredBlockers: [],
  canExecute: true,
  readyToFinalize: false,
  latestRunHref: null,
  hasCommittedManifest: false,
  sealedReviewRecord: null,
};

vi.mock("@/hooks/use-first-review-guide-state", () => ({
  useFirstReviewGuideState: () => prerequisitesCompleteGuideState,
}));

describe("first-review guide — axe (Vitest)", () => {
  it("has no serious axe violations when prerequisites are complete and the next checklist step is shown", async () => {
    const { getByTestId } = render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    expect(getByTestId("first-review-walkthrough-next-step")).toBeTruthy();
    expect(await axe(getByTestId("first-review-one-prerequisite"))).toHaveNoViolations();
  });
});
