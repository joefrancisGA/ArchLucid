import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WelcomeModal } from "@/components/ui/welcome-modal";

const routerPushSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushSpy,
  }),
}));

describe("WelcomeModal", () => {
  beforeEach(() => {
    routerPushSpy.mockClear();
  });

  it("shows operator first-run actions while open", () => {
    const onDismiss = vi.fn();
    const onStartTour = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} onStartTour={onStartTour} />);

    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(screen.getByText("Welcome to ArchLucid")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start tour" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
  });

  it("invokes onStartTour from Start tour and onDismiss from Skip for now", () => {
    const onDismiss = vi.fn();
    const onStartTour = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} onStartTour={onStartTour} />);

    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));
    expect(onStartTour).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("buyer shell shows executive framing on step one", () => {
    render(<WelcomeModal open onDismiss={vi.fn()} buyerShell />);

    expect(screen.getByText(/completed executive review package/i)).toBeInTheDocument();
  });

  it("buyer shell navigates to sample executive summary from final step", () => {
    const onDismiss = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} buyerShell />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "Open sample executive summary" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(routerPushSpy).toHaveBeenCalledWith("/executive/reviews/claims-intake-modernization");
  });
});
