import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import type { ReactNode } from "react";

import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";

function DirectWizardFormProvider(props: {
  readonly values: Readonly<Record<string, unknown>>;
  readonly children: ReactNode;
}) {
  const methods = useForm<WizardFormValues>({
    defaultValues: {
      ...buildDefaultWizardValues(),
      ...props.values,
    } as WizardFormValues,
  });

  return <FormProvider {...methods}>{props.children}</FormProvider>;
}

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
    expect(screen.getByText("1 attached document")).toBeInTheDocument();
  });

  it("labels evidence-only cloud target without showing raw None (P-16)", () => {
    render(
      <WizardFormTestHarness values={{ cloudProvider: "None" }}>
        <WizardStepReview />
      </WizardFormTestHarness>,
    );

    expect(screen.getByText("Evidence-only (no cloud target)")).toBeInTheDocument();
    expect(screen.queryByText("None")).not.toBeInTheDocument();
  });

  it("labels blank identity draft fields as not stored", () => {
    render(
      <DirectWizardFormProvider
        values={{
          systemName: "",
          environment: "",
          cloudProvider: "",
          description: "",
        }}
      >
        <WizardStepReview />
      </DirectWizardFormProvider>,
    );

    expect(screen.getByText("System name was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Environment was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Cloud was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Description was not stored.")).toBeInTheDocument();
  });

  it("explains omitted optional scalar and empty string lists", () => {
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
    expect(priorRow?.textContent).toContain("No prior manifest recorded");

    const advancedSection = screen.getByRole("heading", { name: "Advanced" }).closest("section");
    expect(advancedSection?.textContent).toContain("None recorded on this draft");
    expect(advancedSection?.textContent).toContain("0 attached");
  });

  it("distinguishes missing assumptions, prior manifest, and policy references from stored empty values (P-17–P-19)", () => {
    const { unmount } = render(
      <DirectWizardFormProvider
        values={{
          assumptions: null,
          priorManifestVersion: null,
          policyReferences: null,
        }}
      >
        <WizardStepReview />
      </DirectWizardFormProvider>,
    );

    expect(screen.getByText("Assumptions were not stored.")).toBeInTheDocument();
    expect(screen.getByText("Prior manifest was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Policy references were not stored.")).toBeInTheDocument();
    unmount();

    render(
      <DirectWizardFormProvider
        values={{
          assumptions: [],
          priorManifestVersion: "",
          policyReferences: [],
        }}
      >
        <WizardStepReview />
      </DirectWizardFormProvider>,
    );

    expect(screen.queryByText("Assumptions were not stored.")).not.toBeInTheDocument();
    expect(screen.getByText("No prior manifest recorded")).toBeInTheDocument();

    const advancedSection = screen.getByRole("heading", { name: "Advanced" }).closest("section");
    expect(advancedSection?.textContent).toContain("None recorded on this draft");
  });

  it("distinguishes missing declarations and capabilities from stored empty lists", () => {
    const { unmount } = render(
      <DirectWizardFormProvider values={{ infrastructureDeclarations: null, requiredCapabilities: null }}>
        <WizardStepReview />
      </DirectWizardFormProvider>,
    );

    expect(screen.getByText("Infrastructure declaration count was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Required capabilities were not stored.")).toBeInTheDocument();
    unmount();

    render(
      <DirectWizardFormProvider values={{ infrastructureDeclarations: [], requiredCapabilities: [] }}>
        <WizardStepReview />
      </DirectWizardFormProvider>,
    );

    expect(screen.getByText("0 declarations")).toBeInTheDocument();
    expect(screen.queryByText("Required capabilities were not stored.")).not.toBeInTheDocument();
  });

  it("shows the start-review primary action when paired with WizardNavButtons on the review step", () => {
    const onSubmit = vi.fn();

    render(
      <WizardFormTestHarness values={richValues}>
        <WizardStepReview />
        <WizardNavButtons onSubmit={onSubmit} isLastInputStep submitLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA} canProceed />
      </WizardFormTestHarness>,
    );

    const createBtn = screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA });
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
