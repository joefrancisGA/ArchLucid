"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactNode } from "react";
import type { FieldErrors } from "react-hook-form";
import { useFormContext } from "react-hook-form";

import { Separator } from "@/components/ui/separator";
import { RunWizardCostPreviewCard } from "@/components/wizard/RunWizardCostPreviewCard";
import { WizardPolicyPackCloudMismatchCallout } from "@/components/wizard/WizardPolicyPackCloudMismatchCallout";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL } from "@/lib/guided-intake-copy";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { ARCHITECTURE_HINTS_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";
import { deriveWizardPolicyPackCloudMismatch } from "@/lib/wizard-payload";
import type { WizardFormValues } from "@/lib/wizard-schema";

function wizardConfirmIdentityField(value: string, notStoredLabel: string): string {
  return value.trim().length > 0 ? value : notStoredLabel;
}

function wizardConfirmListEntry(value: string, storedEmptyLabel: string): string {
  return value.trim().length > 0 ? value.trim() : storedEmptyLabel;
}

function wizardConfirmCloudProviderField(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Cloud was not stored.";
  }

  if (trimmed === "None") {
    return "Evidence-only (no cloud target)";
  }

  if (trimmed === "Azure") {
    return "Microsoft Azure";
  }

  if (trimmed === "Aws") {
    return "Amazon Web Services";
  }

  if (trimmed === "Gcp") {
    return "Google Cloud Platform";
  }

  return trimmed;
}

function wizardConfirmNamedAttachmentSummary(
  entries: ReadonlyArray<{ readonly name: string }> | null | undefined,
  options: { readonly countNotStoredLabel: string; readonly unitLabel: string; readonly nameNotStoredLabel: string },
): string {
  if (entries === null || entries === undefined) {
    return options.countNotStoredLabel;
  }

  const withStoredContent = entries.filter(
    (entry) => entry.name.trim().length > 0 || Object.values(entry).some((value) => typeof value === "string" && value.trim().length > 0),
  );
  const unnamedCount = withStoredContent.filter((entry) => entry.name.trim().length === 0).length;
  const namedCount = withStoredContent.length - unnamedCount;
  const countLine =
    namedCount > 0
      ? `${namedCount} ${options.unitLabel}${namedCount === 1 ? "" : "s"}`
      : withStoredContent.length === 0
        ? `0 ${options.unitLabel}s`
        : `0 named ${options.unitLabel}s`;

  if (unnamedCount === 0) {
    return countLine;
  }

  return `${countLine} (${unnamedCount} ${options.nameNotStoredLabel})`;
}

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
  const policyPackCloudMismatch = deriveWizardPolicyPackCloudMismatch(
    {
      ...v,
      policyReferences: v.policyReferences ?? [],
    },
    {
      focusedPilotModeEnabled,
    },
  );

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

        <ReadOnlyBlock title="Identity">
          <dl className="m-0 grid gap-1 sm:grid-cols-[8rem_1fr]">
            <dt className="text-neutral-500">System</dt>
            <dd className="m-0">{wizardConfirmIdentityField(v.systemName, "System name was not stored.")}</dd>
            <dt className="text-neutral-500">Environment</dt>
            <dd className="m-0">{wizardConfirmIdentityField(v.environment, "Environment was not stored.")}</dd>
            <dt className="text-neutral-500">Cloud</dt>
            <dd className="m-0">{wizardConfirmCloudProviderField(v.cloudProvider)}</dd>
            <dt className="text-neutral-500">Prior manifest</dt>
            <dd className="m-0">
              {v.priorManifestVersion === null || v.priorManifestVersion === undefined
                ? "Prior manifest was not stored."
                : v.priorManifestVersion.trim() || "No prior manifest recorded"}
            </dd>
          </dl>
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Description">
          <p className="m-0 whitespace-pre-wrap">
            {wizardConfirmIdentityField(v.description, "Description was not stored.")}
          </p>
          {v.inlineRequirements === null || v.inlineRequirements === undefined ? (
            <p className={cn("mt-2 m-0", OPERATOR_TYPOGRAPHY.helper)}>Inline requirements were not stored.</p>
          ) : v.inlineRequirements.some((s) => s.trim()) ? (
            <div className="mt-2">
              <p className={cn("m-0 font-medium text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Inline requirements</p>
              <ul className="mt-1 list-disc pl-5">
                {v.inlineRequirements.map((line, index) => (
                  <li key={`inline-requirement-${index}`}>
                    {wizardConfirmListEntry(line, "Requirement was stored empty.")}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className={cn("mt-2 m-0", OPERATOR_TYPOGRAPHY.helper)}>Inline requirements were stored empty.</p>
          )}
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Constraints & capabilities">
          <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Constraints</p>
          {v.constraints === null || v.constraints === undefined ? (
            <p className="m-0">Constraints were not stored.</p>
          ) : v.constraints.length === 0 ? (
            <p className="m-0">Constraints were stored empty.</p>
          ) : (
            <ul className="mt-1 list-disc pl-5">
              {v.constraints.map((c, index) => (
                <li key={`constraint-${index}`}>
                  {wizardConfirmListEntry(c, "Constraint was stored empty.")}
                </li>
              ))}
            </ul>
          )}
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            {GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL}
          </p>
          {v.requiredCapabilities === null || v.requiredCapabilities === undefined ? (
            <p className="m-0">Required capabilities were not stored.</p>
          ) : v.requiredCapabilities.length === 0 ? (
            <p className="m-0">Required capabilities were stored empty.</p>
          ) : (
            <ul className="mt-1 list-disc pl-5">
              {v.requiredCapabilities.map((c, index) => (
                <li key={`required-capability-${index}`}>
                  {wizardConfirmListEntry(c, "Required capability was stored empty.")}
                </li>
              ))}
            </ul>
          )}
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Assumptions</p>
          {v.assumptions === null || v.assumptions === undefined ? (
            <p className="m-0">Assumptions were not stored.</p>
          ) : v.assumptions.length === 0 ? (
            <p className="m-0">Assumptions were stored empty.</p>
          ) : (
            <ul className="mt-1 list-disc pl-5">
              {v.assumptions.map((c, index) => (
                <li key={`assumption-${index}`}>
                  {wizardConfirmListEntry(c, "Assumption was stored empty.")}
                </li>
              ))}
            </ul>
          )}
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Advanced">
          <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Policy references</p>
          <p className="m-0">
            {v.policyReferences === null || v.policyReferences === undefined
              ? "Policy references were not stored."
              : v.policyReferences.join(", ") || "None recorded on this draft"}
          </p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_HINTS_BUYER_LABEL}</p>
          <p className="m-0">
            {v.topologyHints === null || v.topologyHints === undefined
              ? "Architecture hints were not stored."
              : v.topologyHints.join(", ") || "None recorded on this draft"}
          </p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Security baseline hints</p>
          <p className="m-0">
            {v.securityBaselineHints === null || v.securityBaselineHints === undefined
              ? "Security baseline hints were not stored."
              : v.securityBaselineHints.join(", ") || "None recorded on this draft"}
          </p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Documents</p>
          <p className="m-0">
            {wizardConfirmNamedAttachmentSummary(v.documents, {
              countNotStoredLabel: "Document count was not stored.",
              unitLabel: "attached document",
              nameNotStoredLabel: "document name was not stored",
            })}
          </p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Infrastructure declarations</p>
          <p className="m-0">
            {wizardConfirmNamedAttachmentSummary(v.infrastructureDeclarations, {
              countNotStoredLabel: "Infrastructure declaration count was not stored.",
              unitLabel: "declaration",
              nameNotStoredLabel: "declaration name was not stored",
            })}
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
