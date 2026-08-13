import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OnboardingTour } from "@/components/OnboardingTour";
import { ARCHLUCID_ONBOARDING_TOUR_START_EVENT } from "@/lib/onboarding-tour";
import {
  ONBOARDING_TOUR_DONE_LINK_HREF,
  ONBOARDING_TOUR_DONE_LINK_LABEL,
  ONBOARDING_TOUR_WELCOME_BODY,
} from "@/lib/operator/operator-onboarding-tour-steps";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  usePathname: () => "/",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

describe("OnboardingTour", () => {
  it("shows workflow-oriented first step copy without internal jargon", () => {
    render(<OnboardingTour />);

    act(() => {
      window.dispatchEvent(new Event(ARCHLUCID_ONBOARDING_TOUR_START_EVENT));
    });

    expect(screen.getByText("Welcome to ArchLucid")).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_TOUR_WELCOME_BODY)).toBeInTheDocument();
    expect(screen.queryByText(/manifest/i)).not.toBeInTheDocument();
  });

  it("links the final step to the in-app pilot checklist", () => {
    render(<OnboardingTour />);

    act(() => {
      window.dispatchEvent(new Event(ARCHLUCID_ONBOARDING_TOUR_START_EVENT));
    });

    for (let index = 0; index < 5; index += 1) {
      act(() => {
        screen.getByRole("button", { name: "Next" }).click();
      });
    }

    const checklistLink = screen.getByRole("link", { name: ONBOARDING_TOUR_DONE_LINK_LABEL });

    expect(checklistLink).toHaveAttribute("href", ONBOARDING_TOUR_DONE_LINK_HREF);
    expect(screen.getByText(/pilot checklist when you want a guided path/i)).toBeInTheDocument();
  });
});
