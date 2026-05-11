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

  it("shows the first onboarding step while open", () => {
    const onDismiss = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} />);

    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(screen.getByText("Welcome to ArchLucid")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip tour" })).toBeInTheDocument();
  });

  it("advances steps and persists dismissal from Skip tour", () => {
    const onDismiss = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Define your architecture")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("navigates to new review after Get started on the final step", () => {
    const onDismiss = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "Get started — new review" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(routerPushSpy).toHaveBeenCalledWith("/reviews/new");
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
