"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import {
  AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_ITEMS,
  AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_TITLE,
  AUTH_DOMAINS_ADD_DOMAIN_READINESS,
  AUTH_DOMAINS_DOMAIN_FORMAT_ERROR,
  AUTH_DOMAINS_DOMAIN_LABEL,
  AUTH_DOMAINS_EMPTY_DESCRIPTION,
  AUTH_DOMAINS_EMPTY_TITLE,
  AUTH_DOMAINS_JOURNEY_SECTION_IDS,
} from "@/lib/auth-domains-page-copy";
import {
  authDomainEnforcementModeKind,
  authDomainVerificationStatusKind,
  labelForAuthDomainEnforcementMode,
  labelForAuthDomainVerificationStatus,
} from "@/lib/auth-domains-enum-labels";
import { DESIGN_TOKENS, OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY, OPERATOR_SELECTION } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { TenantAuthDomainRecord } from "@/lib/admin-auth-domains-api";
import type { RefObject } from "react";

import { AuthDomainsContinueLastViewedRow } from "./AuthDomainsContinueLastViewedRow";
import type { AuthDomainsContinueLastTarget } from "@/lib/resolve-continue-last-auth-domain";
import { writeAuthDomainLastViewedId } from "@/lib/resolve-continue-last-auth-domain";

export type AuthDomainsDomainListPanelProps = {
  readonly loading: boolean;
  readonly domains: readonly TenantAuthDomainRecord[];
  readonly selectedDomain: string;
  readonly setSelectedDomain: (domain: string) => void;
  readonly setDnsInstruction: (value: string | null) => void;
  readonly newDomain: string;
  readonly setNewDomain: (value: string) => void;
  readonly setNewDomainTouched: (value: boolean) => void;
  readonly newDomainInputRef: RefObject<HTMLInputElement | null>;
  readonly showNewDomainFormatError: boolean;
  readonly mutationsBlocked: boolean;
  readonly newDomainValid: boolean;
  readonly handleProposeDomain: () => Promise<void>;
  readonly continueLastDomain: AuthDomainsContinueLastTarget | null;
  readonly onOpenDomain: (normalizedDomain: string) => void;
  readonly hideDomainMutations?: boolean;
};

export function AuthDomainsDomainListPanel(props: AuthDomainsDomainListPanelProps): React.JSX.Element {
  const hideDomainMutations = props.hideDomainMutations === true;

  return (
    <Card data-testid="auth-domains-main-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Sign-in domains</CardTitle>
      </CardHeader>
      <CardContent className={OPERATOR_LAYOUT.sectionStack}>
        <section
          id={AUTH_DOMAINS_JOURNEY_SECTION_IDS.add}
          tabIndex={-1}
          className="space-y-3 outline-none"
          data-testid="auth-domains-add-panel"
        >
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Add domain</h2>
          <div
            className={cn(DESIGN_TOKENS.callout.info, OPERATOR_TYPOGRAPHY.helper, "space-y-2")}
            data-testid="auth-domains-add-prerequisites"
          >
            <p className="m-0 font-medium text-al-text-primary">{AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_TITLE}</p>
            <ul className="m-0 list-disc space-y-1 pl-5">
              {AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Entering a domain does not claim it. Add the DNS TXT record shown after you start verification.
          </p>
          {hideDomainMutations ? null : (
          <div className="space-y-2">
            <Label htmlFor="auth-domains-new-domain" className={OPERATOR_FORM_FIELD_LABEL_CLASS}>
              {AUTH_DOMAINS_DOMAIN_LABEL}
            </Label>
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-[12rem] flex-1 space-y-1">
                <Input
                  ref={props.newDomainInputRef}
                  id="auth-domains-new-domain"
                  value={props.newDomain}
                  onChange={(event) => {
                    props.setNewDomain(event.target.value);
                    props.setNewDomainTouched(true);
                  }}
                  onBlur={() => props.setNewDomainTouched(true)}
                  placeholder="example.com"
                  aria-invalid={props.showNewDomainFormatError}
                  aria-describedby={
                    props.showNewDomainFormatError
                      ? "auth-domains-new-domain-error auth-domains-add-readiness"
                      : "auth-domains-add-readiness"
                  }
                  data-testid="auth-domains-new-domain"
                />
                {props.showNewDomainFormatError ? (
                  <p
                    id="auth-domains-new-domain-error"
                    className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.helper)}
                    role="alert"
                  >
                    {AUTH_DOMAINS_DOMAIN_FORMAT_ERROR}
                  </p>
                ) : null}
                <p
                  id="auth-domains-add-readiness"
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="auth-domains-add-readiness"
                >
                  {AUTH_DOMAINS_ADD_DOMAIN_READINESS}
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => void props.handleProposeDomain()}
                disabled={props.mutationsBlocked || !props.newDomainValid}
                data-testid="auth-domains-add"
              >
                Add domain
              </Button>
            </div>
          </div>
          )}
        </section>

        <section
          id="auth-domains-journey-target-domains"
          tabIndex={-1}
          className="space-y-3 outline-none"
          data-testid="auth-domains-list-section"
        >
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Domains</h2>
          {props.loading ? <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Loading domains…</p> : null}
          {!props.loading && props.domains.length === 0 ? (
            <EnterpriseCompactEmptyState
              title={AUTH_DOMAINS_EMPTY_TITLE}
              description={AUTH_DOMAINS_EMPTY_DESCRIPTION}
              testId="auth-domains-empty-state"
            />
          ) : null}
          {props.continueLastDomain !== null ? (
            <AuthDomainsContinueLastViewedRow target={props.continueLastDomain} onOpen={props.onOpenDomain} />
          ) : null}
          <ul className="space-y-2">
            {props.domains.map((row) => (
              <li key={row.normalizedDomain}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left",
                    props.selectedDomain === row.normalizedDomain ? OPERATOR_SELECTION.row : "border-neutral-200",
                  )}
                  onClick={() => {
                    writeAuthDomainLastViewedId(row.normalizedDomain);
                    props.setSelectedDomain(row.normalizedDomain);
                    props.setDnsInstruction(null);
                  }}
                  data-testid={`auth-domain-row-${row.normalizedDomain}`}
                  data-auth-domain={row.normalizedDomain}
                >
                  <div className="font-medium text-al-text-primary">{row.displayDomain}</div>
                  <div
                    className="flex flex-wrap items-center gap-2 pt-1"
                    data-testid={`auth-domain-status-${row.normalizedDomain}`}
                  >
                    <StatusTag
                      kind={authDomainVerificationStatusKind(row.verificationStatus)}
                      label={labelForAuthDomainVerificationStatus(row.verificationStatus)}
                      data-verification-status={row.verificationStatus}
                    />
                    <StatusTag
                      kind={authDomainEnforcementModeKind(row.enforcementMode)}
                      label={labelForAuthDomainEnforcementMode(row.enforcementMode)}
                      data-enforcement-mode={row.enforcementMode}
                    />
                    {row.isEnforcementActive ? (
                      <StatusTag kind="ready" label="Enforcement active" data-testid="auth-domain-enforcement-active" />
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
