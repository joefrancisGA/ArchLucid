import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { UsabilityFeedbackWidget } from "@/components/usability/UsabilityFeedbackWidget";
import { submitProductFeedback } from "@/lib/api/tenant-customer-success";

vi.mock("next/navigation", () => ({ usePathname: () => "/reviews" }));
vi.mock("@/lib/api/tenant-customer-success", () => ({ submitProductFeedback: vi.fn() }));
vi.mock("@/lib/toast", () => ({ showSuccess: vi.fn(), showError: vi.fn() }));

it("prevents edits to feedback while the submitted draft is pending", async () => {
  const onOpenChange = vi.fn();
  let failSubmission!: (error: Error) => void;
  vi.mocked(submitProductFeedback).mockReturnValueOnce(new Promise((_, reject) => {
    failSubmission = reject;
  }));
  render(<UsabilityFeedbackWidget open onOpenChange={onOpenChange} />);
  const comment = screen.getByRole("textbox");
  const score = screen.getByRole("slider");

  fireEvent.change(comment, { target: { value: "Keep my draft." } });
  fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

  expect(comment).toBeDisabled();
  expect(score).toBeDisabled();

  await act(async () => {
    failSubmission(new Error("Could not send"));
  });
  expect(comment).toBeEnabled();
  expect(score).toBeEnabled();
  expect(comment).toHaveValue("Keep my draft.");
  expect(onOpenChange).not.toHaveBeenCalled();
});
