"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactNode } from "react";
import type { FieldErrors } from "react-hook-form";
import { useFormContext } from "react-hook-form";

import { Separator } from "@/components/ui/separator";
import { AssuranceCoveragePreviewPanel } from "@/components/wizard/AssuranceCoveragePreviewPanel";
import { RunWizardCostPreviewCard } from "@/components/wizard/RunWizardCostPreviewCard";
import { WizardPolicyPackCloudMismatchCallout } from "@/components/wizard/WizardPolicyPackCloudMismatchCallout";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL } from "@/lib/guided-intake-copy";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { ARCHITECTURE_HINTS_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";
import { deriveWizardPolicyPackCloudMismatch } from "@/lib/wizard-payload";
import type { WizardFormValues } from "@/lib/wizard-schema";

function ErrorList({ errors }: { errors: FieldErrors<WizardFormValues> }) {
  const messages: string[] = [];

  const walk = (prefix: string, err: unknown): void => {
    if (!err || typeof err !== "object") {
      return;
    }

    if ("message" in err && typeof (err as { message?: string }).message === "string") {
      const msg = (err as { message: string }).message;

      if (msg) {
        messages.push(prefix ? `${prefix}: ${msg}` : msg);
      }

      return;
    }

    for (const [key, val] of Object.entries(err)) {
      if (key === "ref" || key === "type" || key === "types") {
        continue;
      }

      walk(prefix ? `${prefix}.${key}` : key, val);
    }
  };

  walk("", errors);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn("rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50 p-3", OPERATOR_TYPOGRAPHY.body)}
    >
      <p className="m-0 font-semibold">Fix validation errors before creating the architecture review:</p>
      <ul className="mt-2 mb-0 list-disc pl-5">
        {messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

function ReadOnlyBlock(props: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className={cn("font-semibold text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</h3>
      <div className={cn("mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{props.children}</div>
    </section>
  );
}

/**
 * Step 6: read-only summary and validation error surface before API submit (handled by parent nav).
 */
export function WizardStepReview(props: { readonly focusedPilotModeEnabled?: boolean }) {
  const { watch, formState } = useFormContext<WizardFormValues>();
  const v = watch();
  const focusedPilotModeEnabled = props.focusedPilotModeEnabled ?? true;
  const policyPackCloudMismatch = deriveWizardPolicyPackCloudMismatch(v, {
    focusedPilotModeEnabled,
  });

  return (
    <WizardStepPanel
      title="Review & submit"
      description={`Confirm values below. Use Back to edit earlier steps. ${BUYER_START_ARCHITECTURE_REVIEW_CTA} sends POST /v1/architecture/request.`}
    >
      <div className="space-y-4">
        <ErrorList errors={formState.errors} />

        {policyPackCloudMismatch !== null ? (
          <WizardPolicyPackCloudMismatchCallout detail={policyPackCloudMismatch} />
        ) : null}

        <RunWizardCostPreviewCard />

        <AssuranceCoveragePreviewPanel
          cloudProvider={v.cloudProvider}
          focusedPilotModeEnabled={focusedPilotModeEnabled}
          descriptionText={v.description}
        />

        <ReadOnlyBlock title="Identity">
          <dl className="m-0 grid gap-1 sm:grid-cols-[8rem_1fr]">
            <dt className="text-neutral-500">System</dt>
            <dd className="m-0">{v.systemName}</dd>
            <dt className="text-neutral-500">Environment</dt>
            <dd className="m-0">{v.environment}</dd>
            <dt className="text-neutral-500">Cloud</dt>
            <dd className="m-0">{v.cloudProvider}</dd>
            <dt className="text-neutral-500">Prior manifest</dt>
            <dd className="m-0">{v.priorManifestVersion?.trim() || " — "}</dd>
          </dl>
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Description">
          <p className="m-0 whitespace-pre-wrap">{v.description}</p>
          {(v.inlineRequirements ?? []).some((s) => s.trim()) ? (
            <div className="mt-2">
              <p className={cn("m-0 font-medium text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Inline requirements</p>
              <ul className="mt-1 list-disc pl-5">
                {(v.inlineRequirements ?? [])
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
              </ul>
            </div>
          ) : null}
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Constraints & capabilities">
          <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Constraints</p>
          <ul className="mt-1 list-disc pl-5">
            {(v.constraints ?? []).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            {GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL}
          </p>
          <ul className="mt-1 list-disc pl-5">
            {(v.requiredCapabilities ?? []).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Assumptions</p>
          <ul className="mt-1 list-disc pl-5">
            {(v.assumptions ?? []).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Advanced">
          <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Policy references</p>
          <p className="m-0">{(v.policyReferences ?? []).join(", ") || " — "}</p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_HINTS_BUYER_LABEL}</p>
          <p className="m-0">{(v.topologyHints ?? []).join(", ") || " — "}</p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Security baseline hints</p>
          <p className="m-0">{(v.securityBaselineHints ?? []).join(", ") || " — "}</p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Documents</p>
          <p className="m-0">{(v.documents ?? []).filter((d) => d.name.trim()).length} attached</p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Infrastructure declarations</p>
          <p className="m-0">
            {(v.infrastructureDeclarations ?? []).filter((d) => d.name.trim()).length} declaration(s)
          </p>
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Request id">
          <code className={OPERATOR_TYPOGRAPHY.helper}>{v.requestId}</code>
        </ReadOnlyBlock>
      </div>
    </WizardStepPanel>
  );
}
