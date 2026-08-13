import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OPERATOR_FIRST_RUN_WELCOME, WelcomeModal } from "@/components/ui/welcome-modal";

const routerPushSpy = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({
    push: routerPushSpy,
  }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

describe("WelcomeModal", () => {
  beforeEach(() => {
    routerPushSpy.mockClear();
  });

  it("shows operator first-run branding, copy, and actions while open", () => {
    const onDismiss = vi.fn();
    const onStartTour = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} onStartTour={onStartTour} />);

    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-modal-brand-mark")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_FIRST_RUN_WELCOME.title)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_FIRST_RUN_WELCOME.description)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start tour" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Skip for now" })).toHaveLength(2);
  });

  it("invokes onStartTour from Start tour and onDismiss from Skip for now", () => {
    const onDismiss = vi.fn();
    const onStartTour = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} onStartTour={onStartTour} />);

    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));
    expect(onStartTour).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Skip for now" })[0]!);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismisses from the top-right close control with the Skip for now label", () => {
    const onDismiss = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} onStartTour={vi.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Skip for now" })[1]!);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("buyer shell shows sponsor framing on step one", () => {
    render(<WelcomeModal open onDismiss={vi.fn()} buyerShell />);

    expect(screen.getByText(/completed sponsor review/i)).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-modal-brand-mark")).not.toBeInTheDocument();
  });

  it("buyer shell navigates to sample sponsor report from final step", () => {
    const onDismiss = vi.fn();

    render(<WelcomeModal open onDismiss={onDismiss} buyerShell />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "Open sample sponsor report" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(routerPushSpy).toHaveBeenCalledWith("/architecture/reviews/claims-intake-modernization");
  });
});
