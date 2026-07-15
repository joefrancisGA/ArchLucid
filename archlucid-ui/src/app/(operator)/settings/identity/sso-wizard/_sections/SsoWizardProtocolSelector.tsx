"use client";

import { KeyRound, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SSO_WIZARD_PROTOCOL_REQUIRED_HELPER,
} from "@/lib/sso-wizard-copy";

import type { SsoWizardProtocol } from "./sso-wizard-state";

type ProtocolOption = {
  readonly value: SsoWizardProtocol;
  readonly title: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly recommended?: boolean;
  readonly icon: React.ComponentType<{ className?: string }>;
};

const PROTOCOL_OPTIONS: readonly ProtocolOption[] = [
  {
    value: "oidc",
    title: "OpenID Connect",
    shortLabel: "OIDC",
    description:
      "Use OIDC for Microsoft Entra ID, Okta, Auth0, and other modern identity providers.",
    recommended: true,
    icon: KeyRound,
  },
  {
    value: "saml",
    title: "SAML 2.0",
    shortLabel: "SAML 2.0",
    description:
      "Use SAML when your identity provider supplies SSO metadata or requires SAML-based federation.",
    icon: ShieldCheck,
  },
];

export type SsoWizardProtocolSelectorProps = {
  readonly value: SsoWizardProtocol | null;
  readonly onChange: (protocol: SsoWizardProtocol) => void;
  readonly disabled?: boolean;
};

export function SsoWizardProtocolSelector(props: SsoWizardProtocolSelectorProps): React.JSX.Element {
  const showRequirement = props.value === null;

  return (
    <div className="space-y-4" data-testid="sso-protocol-selector">
      <fieldset>
        <legend className="sr-only">Single sign-on protocol</legend>
        <div
          className="grid gap-3 md:grid-cols-2"
          role="radiogroup"
          aria-label="Single sign-on protocol"
          aria-describedby={showRequirement ? "sso-protocol-requirement" : undefined}
        >
          {PROTOCOL_OPTIONS.map((option) => {
            const selected = props.value === option.value;
            const inputId = `sso-protocol-${option.value}`;
            const Icon = option.icon;

            return (
              <label
                key={option.value}
                htmlFor={inputId}
                className={cn(
                  "flex h-full cursor-pointer flex-col rounded-lg border p-4 transition-colors",
                  "outline-none focus-within:ring-2 focus-within:ring-[var(--al-accent-border-focus)] focus-within:ring-offset-2",
                  selected
                    ? "border-teal-700 bg-teal-50/70 ring-2 ring-teal-700/25 dark:border-teal-500 dark:bg-teal-950/30 dark:ring-teal-400/25"
                    : "border-neutral-200 bg-al-surface-raised hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600",
                  props.disabled && "pointer-events-none opacity-60",
                )}
                data-testid={`sso-protocol-${option.value}`}
              >
                <input
                  id={inputId}
                  type="radio"
                  name="sso-protocol"
                  className="sr-only"
                  value={option.value}
                  checked={selected}
                  disabled={props.disabled}
                  aria-label={`${option.title} (${option.shortLabel})`}
                  onChange={() => props.onChange(option.value)}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
                        selected
                          ? "border-teal-700 bg-white text-teal-800 dark:border-teal-500 dark:bg-neutral-900 dark:text-teal-200"
                          : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
                      )}
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                          {option.title}
                        </p>
                        {option.recommended ? (
                          <span
                            className={cn(
                              "rounded-full border border-teal-700/30 bg-teal-50 px-2 py-0.5 text-teal-900 dark:border-teal-500/40 dark:bg-teal-950/40 dark:text-teal-100",
                              OPERATOR_TYPOGRAPHY.micro,
                            )}
                          >
                            Recommended
                          </span>
                        ) : null}
                      </div>
                      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden
                    className={cn(
                      "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-teal-700 bg-teal-700 dark:border-teal-500 dark:bg-teal-600"
                        : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900",
                    )}
                  >
                    {selected ? <span className="block h-2 w-2 rounded-full bg-white" /> : null}
                  </span>
                </div>

                <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{option.shortLabel}</p>
              </label>
            );
          })}
        </div>
      </fieldset>

      {showRequirement ? (
        <p id="sso-protocol-requirement" className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {SSO_WIZARD_PROTOCOL_REQUIRED_HELPER}
        </p>
      ) : null}
    </div>
  );
}
