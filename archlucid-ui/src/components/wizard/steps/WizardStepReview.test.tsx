import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";
import type { WizardFormValues } from "@/lib/wizard-schema";

describe("WizardStepReview", () => {
  const richValues: Partial<WizardFormValues> = {
    systemName: "AcmeOrderApi",
    environment: "production",
    cloudProvider: "Azure",
    priorManifestVersion: "",
    description: "This is a long enough description for the review step to display correctly in tests.",
    inlineRequirements: ["Rate limits on public endpoints"],
    constraints: ["EU-only data"],
    requiredCapabilities: ["TLS 1.2+"],
    assumptions: ["SRE on-call"],
    policyReferences: ["policy-pack:default"],
    topologyHints: ["Hub-spoke"],
    securityBaselineHints: ["Encrypt at rest"],
    documents: [{ name: "adr-1.md", contentType: "text/markdown", content: "body" }],
    infrastructureDeclarations: [{ name: "main.tf", format: "simple-terraform", content: "resource {}" }],
  };

  it("renders a read-only summary for identity, description, and advanced sections", () => {
    render(
      <WizardFormTestHarness values={richValues}>
        <WizardStepReview />
      </WizardFormTestHarness>,
    );

    expect(screen.getByRole("heading", { name: "Review & submit" })).toBeInTheDocument();
    expect(screen.getByText("AcmeOrderApi")).toBeInTheDocument();
    expect(screen.getByText("production")).toBeInTheDocument();
    expect(screen.getByText("Azure")).toBeInTheDocument();
    expect(screen.getByText("Rate limits on public endpoints")).toBeInTheDocument();
    expect(screen.getByText("EU-only data")).toBeInTheDocument();
    expect(screen.getByText("policy-pack:default")).toBeInTheDocument();
  });

  it("shows em dash placeholders for empty optional scalar and empty string lists", () => {
    render(
      <WizardFormTestHarness
        values={{
          priorManifestVersion: "",
          policyReferences: [],
          topologyHints: [],
          securityBaselineHints: [],
        }}
      >
        <WizardStepReview />
      </WizardFormTestHarness>,
    );

    const priorRow = screen.getByText("Prior manifest").closest("dl");
    expect(priorRow?.textContent).toContain("—");

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the Create request primary action when paired with WizardNavButtons on the review step", () => {
    const onSubmit = vi.fn();

    render(
      <WizardFormTestHarness values={richValues}>
        <WizardStepReview />
        <WizardNavButtons onSubmit={onSubmit} isLastInputStep submitLabel="Create request" canProceed />
      </WizardFormTestHarness>,
    );

    const createBtn = screen.getByRole("button", { name: "Create request" });
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
