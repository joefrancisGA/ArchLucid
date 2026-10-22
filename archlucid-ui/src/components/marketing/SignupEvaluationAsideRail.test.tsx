import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignupEvaluationAsideRail } from "@/components/marketing/SignupEvaluationAsideRail";
import {
  SIGNUP_ASSURANCE_FACTS,
  SIGNUP_ASSURANCE_HEADING,
  SIGNUP_DEMO_PATH_NOTE,
  SIGNUP_PROCESS_HEADING,
  SIGNUP_PROCESS_STEPS,
} from "@/lib/signup-invite-only-copy";

describe("SignupEvaluationAsideRail", () => {
  it("renders the request process and evaluation posture", () => {
    render(<SignupEvaluationAsideRail />);

    expect(screen.getByRole("heading", { name: SIGNUP_PROCESS_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SIGNUP_ASSURANCE_HEADING })).toBeInTheDocument();

    SIGNUP_PROCESS_STEPS.forEach((step) => {
      expect(screen.getByText(`${step.title}.`)).toBeInTheDocument();
      expect(screen.getByText(step.detail)).toBeInTheDocument();
    });

    expect(screen.getByText(SIGNUP_DEMO_PATH_NOTE)).toBeInTheDocument();

    SIGNUP_ASSURANCE_FACTS.forEach((fact) => {
      expect(screen.getByText(`${fact.label}.`)).toBeInTheDocument();
      expect(screen.getByText(fact.detail)).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /See a sample review/i })).toHaveAttribute("href", "/see-it");
  });

  it("claims no attestation the product does not hold", () => {
    render(<SignupEvaluationAsideRail />);

    const railText = (screen.getByTestId("signup-evaluation-rail").textContent ?? "").toLowerCase();

    expect(railText).not.toMatch(/soc 2 (type|attestation|certified)/);
    expect(railText).not.toMatch(/iso 27001/);
    expect(railText).not.toMatch(/penetration test report/);
  });
});
