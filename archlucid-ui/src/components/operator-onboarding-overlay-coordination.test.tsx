import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingTour } from "@/components/OnboardingTour";
import { WelcomeModal } from "@/components/ui/welcome-modal";
import { ARCHLUCID_ONBOARDING_TOUR_START_EVENT } from "@/lib/onboarding-tour";
import { isWelcomeModalVisible, setWelcomeModalVisible } from "@/lib/operator/operator-onboarding-coordination";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
  }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

function queryWelcomeModal(): HTMLElement | null {
  return screen.queryByTestId("welcome-modal");
}

function queryOnboardingTourStep(): HTMLElement | null {
  return screen.queryByText(/^1 of \d+$/i)?.closest('[role="dialog"]') ?? null;
}

describe("operator onboarding overlay coordination", () => {
  afterEach(() => {
    setWelcomeModalVisible(false);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("never renders the guided tour coachmark while the welcome modal is visible", () => {
    setWelcomeModalVisible(true);

    render(<OnboardingTour />);

    window.dispatchEvent(new Event(ARCHLUCID_ONBOARDING_TOUR_START_EVENT));

    expect(queryOnboardingTourStep()).not.toBeInTheDocument();
    expect(isWelcomeModalVisible()).toBe(true);
  });

  it("shows only the welcome modal on first-run before the tour starts", () => {
    const onDismiss = vi.fn();
    const onStartTour = vi.fn();

    render(
      <>
        <WelcomeModal open onDismiss={onDismiss} onStartTour={onStartTour} />
        <OnboardingTour />
      </>,
    );

    setWelcomeModalVisible(true);

    expect(queryWelcomeModal()).toBeInTheDocument();
    expect(queryOnboardingTourStep()).not.toBeInTheDocument();
  });

  it("starts the guided tour after Start tour without overlapping the welcome modal", () => {
    const onDismiss = vi.fn();

    const { rerender } = render(
      <>
        <WelcomeModal
          open
          onDismiss={onDismiss}
          onStartTour={() => {
            setWelcomeModalVisible(false);
            window.dispatchEvent(new Event(ARCHLUCID_ONBOARDING_TOUR_START_EVENT));
          }}
        />
        <OnboardingTour />
      </>,
    );

    setWelcomeModalVisible(true);

    expect(queryWelcomeModal()).toBeInTheDocument();
    expect(queryOnboardingTourStep()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));

    rerender(
      <>
        <WelcomeModal open={false} onDismiss={onDismiss} onStartTour={() => undefined} />
        <OnboardingTour />
      </>,
    );

    expect(queryWelcomeModal()).not.toBeInTheDocument();
    expect(screen.getByText("1 of 6")).toBeInTheDocument();
    expect(queryOnboardingTourStep()).toBeInTheDocument();
  });

  it("manual tour start does not require welcome-modal dismissal state", () => {
    render(<OnboardingTour />);

    act(() => {
      window.dispatchEvent(new Event(ARCHLUCID_ONBOARDING_TOUR_START_EVENT));
    });

    expect(screen.getByText("1 of 6")).toBeInTheDocument();
    expect(queryWelcomeModal()).not.toBeInTheDocument();
  });
});
