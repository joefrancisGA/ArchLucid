import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  commitArchitectureRunMock,
  createArchitectureRunMock,
  seedFakeArchitectureRunResultsMock,
} = vi.hoisted(() => ({
  createArchitectureRunMock: vi.fn(),
  seedFakeArchitectureRunResultsMock: vi.fn(),
  commitArchitectureRunMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createArchitectureRunMock(...args),
  seedFakeArchitectureRunResults: (...args: unknown[]) => seedFakeArchitectureRunResultsMock(...args),
  commitArchitectureRun: (...args: unknown[]) => commitArchitectureRunMock(...args),
}));

import { OnboardWizardClient } from "./OnboardWizardClient";

describe("OnboardWizardClient", () => {
  beforeEach(() => {
    createArchitectureRunMock.mockReset();
    seedFakeArchitectureRunResultsMock.mockReset();
    commitArchitectureRunMock.mockReset();
  });

  it("advances through seed and commit to hand-off", async () => {
    createArchitectureRunMock.mockResolvedValue({ run: { runId: "run-xyz" } });
    seedFakeArchitectureRunResultsMock.mockResolvedValue(undefined);
    commitArchitectureRunMock.mockResolvedValue(undefined);

    render(<OnboardWizardClient />);

    fireEvent.change(screen.getByLabelText(/system name/i), { target: { value: "Billing" } });
    fireEvent.change(screen.getByLabelText(/^brief$/i), { target: { value: "PCI scope" } });

    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await screen.findByText("run-xyz");

    fireEvent.click(screen.getByRole("button", { name: /seed fake results/i }));

    await screen.findByRole("button", { name: /commit run/i });

    fireEvent.click(screen.getByRole("button", { name: /commit run/i }));

    await waitFor(() => {
      expect(commitArchitectureRunMock).toHaveBeenCalledWith("run-xyz");
    });

    expect(await screen.findByText(/first commit recorded/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /\/runs\/run-xyz/i })).toHaveAttribute("href", "/runs/run-xyz");
  });

  it("skips seed when operator chooses continue", async () => {
    createArchitectureRunMock.mockResolvedValue({ run: { runId: "run-skip" } });
    commitArchitectureRunMock.mockResolvedValue(undefined);

    render(<OnboardWizardClient />);

    fireEvent.change(screen.getByLabelText(/system name/i), { target: { value: "Claims" } });
    fireEvent.change(screen.getByLabelText(/^brief$/i), { target: { value: "OAuth" } });
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await screen.findByText("run-skip");

    fireEvent.click(screen.getByRole("button", { name: /agent results ready/i }));

    await screen.findByRole("button", { name: /commit run/i });

    expect(seedFakeArchitectureRunResultsMock).not.toHaveBeenCalled();
  });
});
