"use client";

import { Boxes, Building2, KeyRound, Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SSO_WIZARD_IDP_PRESETS,
  type SsoWizardIdpPresetId,
} from "@/lib/sso-wizard-idp-presets";

type IdpOptionIcon = React.ComponentType<{ className?: string }>;

const IDP_ICONS: Record<SsoWizardIdpPresetId, IdpOptionIcon> = {
  entra: Building2,
  okta: Shield,
  auth0: KeyRound,
  other: Boxes,
};

export type SsoWizardIdpSelectorProps = {
  readonly value: SsoWizardIdpPresetId | null;
  readonly onChange: (idpPresetId: SsoWizardIdpPresetId) => void;
  readonly disabled?: boolean;
};

export function SsoWizardIdpSelector(props: SsoWizardIdpSelectorProps): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="sso-idp-selector">
      <fieldset>
        <legend className="sr-only">Identity provider</legend>
        <div
          className="grid gap-3 md:grid-cols-2"
          role="radiogroup"
          aria-label="Identity provider"
        >
          {SSO_WIZARD_IDP_PRESETS.map((option) => {
            const selected = props.value === option.id;
            const inputId = `sso-idp-${option.id}`;
            const Icon = IDP_ICONS[option.id];

            return (
              <label
                key={option.id}
                htmlFor={inputId}
                className={cn(
                  "flex h-full cursor-pointer flex-col rounded-lg border p-4 transition-colors",
                  "outline-none focus-within:ring-2 focus-within:ring-[var(--al-accent-border-focus)] focus-within:ring-offset-2",
                  selected
                    ? "border-teal-700 bg-teal-50/70 ring-2 ring-teal-700/25 dark:border-teal-500 dark:bg-teal-950/30 dark:ring-teal-400/25"
                    : "border-neutral-200 bg-al-surface-raised hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600",
                  props.disabled && "pointer-events-none opacity-60",
                )}
                data-testid={`sso-idp-${option.id}`}
              >
                <input
                  id={inputId}
                  type="radio"
                  name="sso-idp"
                  className="sr-only"
                  value={option.id}
                  checked={selected}
                  disabled={props.disabled}
                  aria-label={option.label}
                  onChange={() => props.onChange(option.id)}
                />

                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-teal-700 bg-teal-700 dark:border-teal-500 dark:bg-teal-600"
                        : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900",
                    )}
                  >
                    {selected ? <span className="block h-2 w-2 rounded-full bg-white" /> : null}
                  </span>

                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
                      selected
                        ? "border-teal-700 bg-white text-teal-800 dark:border-teal-500 dark:bg-neutral-900 dark:text-teal-200"
                        : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
                    )}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <div>
                    <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                      {option.label}
                    </p>
                    <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
