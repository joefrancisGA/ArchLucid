import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";
import { applyWizardPreset, wizardPresets } from "@/lib/wizard-presets";

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

function DirtyFieldWizardFormProvider(props: {
  readonly values: Readonly<Record<string, unknown>>;
  readonly dirtyFields: readonly (keyof WizardFormValues)[];
  readonly children: ReactNode;
}) {
  const methods = useForm<WizardFormValues>({
    defaultValues: {
      ...buildDefaultWizardValues(),
      ...props.values,
    } as WizardFormValues,
  });

  useEffect(() => {
    for (const field of props.dirtyFields) {
      const current = methods.getValues(field);

      if (field === "priorManifestVersion" && typeof current === "string" && current.trim().length === 0) {
        methods.setValue(field, "00000000-0000-0000-0000-000000000001", { shouldTouch: false });
        methods.setValue(field, "", { shouldTouch: true });
        continue;
      }

      if (typeof current === "string" && current.trim().length === 0) {
        methods.setValue(field, "placeholder", { shouldTouch: false });
        methods.setValue(field, "", { shouldTouch: true });
        continue;
      }

      methods.setValue(field, current, { shouldTouch: true });
    }
  }, [methods, props.dirtyFields]);

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
    expect(screen.getByText("Microsoft Azure")).toBeInTheDocument();
    expect(screen.getByText("Rate limits on public endpoints")).toBeInTheDocument();
    expect(screen.getByText("EU-only data")).toBeInTheDocument();
    expect(screen.getByText("policy-pack:default")).toBeInTheDocument();
    expect(screen.getByText("1 attached document")).toBeInTheDocument();
  });

  it("labels untouched default cloud as not chosen", () => {
    render(
      <WizardFormTestHarness values={{ cloudProvider: "None" }}>
        <WizardStepReview />
      </WizardFormTestHarness>,
    );

    expect(screen.getByText("Cloud target was not chosen.")).toBeInTheDocument();
    expect(screen.queryByText("None")).not.toBeInTheDocument();
  });

  it("labels explicit evidence-only cloud after the field is touched", async () => {
    render(
      <DirtyFieldWizardFormProvider values={{ cloudProvider: "None" }} dirtyFields={["cloudProvider"]}>
        <WizardStepReview />
      </DirtyFieldWizardFormProvider>,
    );

    expect(await screen.findByText("Evidence-only (no cloud target)")).toBeInTheDocument();
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
    expect(priorRow?.textContent).toContain("Prior manifest was not entered.");

    const advancedSection = screen.getByRole("heading", { name: "Advanced" }).closest("section");
    expect(advancedSection?.textContent).toContain("Policy references were stored empty.");
    expect(advancedSection?.textContent).toContain("Documents were not added when untouched.");
  });

  it("distinguishes missing assumptions, prior manifest, and policy references from stored empty values (P-17–P-19)", async () => {
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
      <DirtyFieldWizardFormProvider
        values={{
          assumptions: [],
          priorManifestVersion: "",
          policyReferences: [],
        }}
        dirtyFields={["priorManifestVersion"]}
      >
        <WizardStepReview />
      </DirtyFieldWizardFormProvider>,
    );

    expect(screen.queryByText("Assumptions were not stored.")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Prior manifest was stored empty.")).toBeInTheDocument();
    });

    const advancedSection = screen.getByRole("heading", { name: "Advanced" }).closest("section");
    expect(advancedSection?.textContent).toContain("Architecture hints were stored empty.");
  });

  it("labels whitespace-only list entries as stored empty (P-16–P-19)", () => {
    render(
      <DirectWizardFormProvider
        values={{
          inlineRequirements: ["Rate limits", "   "],
          constraints: ["EU-only", " "],
          requiredCapabilities: ["TLS 1.2+", ""],
          assumptions: ["SRE on-call", "\t"],
        }}
      >
        <WizardStepReview />
      </DirectWizardFormProvider>,
    );

    expect(screen.getByText("Requirement was stored empty.")).toBeInTheDocument();
    expect(screen.getByText("Constraint was stored empty.")).toBeInTheDocument();
    expect(screen.getByText("Required capability was stored empty.")).toBeInTheDocument();
    expect(screen.getByText("Assumption was stored empty.")).toBeInTheDocument();
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

    expect(screen.getByText("Infrastructure declarations were not added.")).toBeInTheDocument();
    expect(screen.queryByText("Required capabilities were not stored.")).not.toBeInTheDocument();
  });

  it("labels untouched quick-start preset fields as starter-profile fills", () => {
    const preset = wizardPresets.find((entry) => entry.id === "greenfield-web-app");

    expect(preset).toBeDefined();

    const values = applyWizardPreset(buildDefaultWizardValues(), preset!.values);

    render(
      <DirectWizardFormProvider values={values}>
        <WizardStepReview quickStartWizard starterPresetId="greenfield-web-app" />
      </DirectWizardFormProvider>,
    );

    expect(screen.getByText("System name was filled from the starter profile id, not typed.")).toBeInTheDocument();
    expect(screen.getByText("Environment was filled from the starter profile and not typed.")).toBeInTheDocument();
    expect(screen.getByText("Description was filled from the starter profile and not typed.")).toBeInTheDocument();
    expect(screen.getAllByText("These entries were filled from the starter profile and not typed.")).toHaveLength(2);
  });

  it("shows typed constraint values after the starter-profile list is dirtied", async () => {
    const preset = wizardPresets.find((entry) => entry.id === "greenfield-web-app");

    expect(preset).toBeDefined();

    const values = applyWizardPreset(buildDefaultWizardValues(), preset!.values);

    function EditedConstraintsProvider(): React.JSX.Element {
      const methods = useForm<WizardFormValues>({
        defaultValues: values,
      });

      useEffect(() => {
        methods.setValue("constraints", ["Typed constraint"], { shouldDirty: true });
      }, [methods]);

      return (
        <FormProvider {...methods}>
          <WizardStepReview quickStartWizard starterPresetId="greenfield-web-app" />
        </FormProvider>
      );
    }

    render(<EditedConstraintsProvider />);

    expect(await screen.findByText("Typed constraint")).toBeInTheDocument();
    expect(screen.queryByText("Prefer cloud-native hosting")).not.toBeInTheDocument();
    expect(screen.getByText("These entries were filled from the starter profile and not typed.")).toBeInTheDocument();
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
