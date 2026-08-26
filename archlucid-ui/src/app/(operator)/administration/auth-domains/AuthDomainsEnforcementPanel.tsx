"use client";

import {
  type TenantAuthDomainEnforcementReadiness,
  type TenantAuthDomainRecord,
  type TenantAuthDomainRecoveryAdminRecord,
} from "@/lib/admin-auth-domains-api";
import { AUTH_DOMAINS_ENFORCEMENT_WARNING } from "@/lib/auth-domains-confirm-copy";
import { AUTH_DOMAINS_JOURNEY_SECTION_IDS } from "@/lib/auth-domains-page-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusTag } from "@/components/ui/status-tag";

export type AuthDomainsEnforcementPanelProps = {
  readonly selected: TenantAuthDomainRecord;
  readonly readiness: TenantAuthDomainEnforcementReadiness | null;
  readonly sessionAcknowledged: boolean;
  readonly setSessionAcknowledged: (value: boolean) => void;
  readonly mutationsBlocked: boolean;
  readonly recoveryAdmins: readonly TenantAuthDomainRecoveryAdminRecord[];
  readonly recoveryEmail: string;
  readonly setRecoveryEmail: (value: string) => void;
  readonly requestSetEnforcementMode: (request: {
    readonly enforcementMode: string;
    readonly allowEmailOtpRecovery: boolean;
  }) => void;
  readonly requestEnableEnforcement: () => void;
  readonly handleRemoveRecoveryAdmin: (row: TenantAuthDomainRecoveryAdminRecord) => Promise<void>;
  readonly handleAddRecoveryAdmin: () => Promise<void>;
};

export function AuthDomainsEnforcementPanel(props: AuthDomainsEnforcementPanelProps): React.JSX.Element {
  return (
    <>
      <div
        id={AUTH_DOMAINS_JOURNEY_SECTION_IDS.enforce}
        tabIndex={-1}
        className="space-y-2 outline-none"
        data-testid="auth-domains-enforcement-checklist"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>Pre-enforcement checklist</p>
        <ul className="space-y-2">
          {(props.readiness?.checklist ?? []).map((item) => (
            <li key={item.key} className="flex flex-wrap items-center gap-2">
              <StatusTag
                kind={item.complete ? "ready" : item.required ? "needs-attention" : "neutral"}
                label={item.complete ? "Complete" : "Incomplete"}
                data-testid={`auth-domains-checklist-${item.key}`}
              />
              <span className={OPERATOR_TYPOGRAPHY.body}>
                {item.label}
                {item.required ? "" : " (recommended)"}
                {item.detail ? ` — ${item.detail}` : ""}
              </span>
            </li>
          ))}
          <li className="flex flex-wrap items-center gap-2">
            <BooleanStatusChip
              value={props.sessionAcknowledged}
              trueLabel="Acknowledged"
              falseLabel="Not acknowledged"
              data-testid="auth-domains-session-ack-status"
            />
            <span className={OPERATOR_TYPOGRAPHY.body}>Current session acknowledged</span>
          </li>
        </ul>
        <label className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <input
            type="checkbox"
            checked={props.sessionAcknowledged}
            onChange={(event) => props.setSessionAcknowledged(event.target.checked)}
            disabled={props.mutationsBlocked}
            data-testid="auth-domains-session-ack"
          />
          I confirm I am signed in with authority to enable SSO enforcement for this organization.
        </label>
        {props.readiness?.blockReason ? (
          <div
            className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
            data-testid="auth-domains-block-reason"
          >
            {props.readiness.blockReason}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>Enforcement mode</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={props.mutationsBlocked}
            data-testid="auth-domains-enforcement-optional"
            onClick={() =>
              props.requestSetEnforcementMode({
                enforcementMode: "SsoOptional",
                allowEmailOtpRecovery: false,
              })
            }
          >
            SSO optional
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={props.mutationsBlocked}
            data-testid="auth-domains-enforcement-required"
            onClick={() =>
              props.requestSetEnforcementMode({
                enforcementMode: "SsoRequiredForVerifiedDomain",
                allowEmailOtpRecovery: false,
              })
            }
          >
            Require SSO
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={props.mutationsBlocked}
            data-testid="auth-domains-enforcement-recovery"
            onClick={() =>
              props.requestSetEnforcementMode({
                enforcementMode: "SsoRequiredWithRecoveryException",
                allowEmailOtpRecovery: true,
              })
            }
          >
            Require SSO with recovery
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div
          className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="auth-domains-enforcement-warning"
        >
          {AUTH_DOMAINS_ENFORCEMENT_WARNING}
        </div>
        <Button
          type="button"
          variant="primary"
          data-testid="auth-domains-enable-enforcement"
          disabled={props.mutationsBlocked || !props.sessionAcknowledged || props.readiness?.canEnableEnforcement === false}
          onClick={() => props.requestEnableEnforcement()}
        >
          Enable enforcement
        </Button>
      </div>

      {props.selected.enforcementMode === "SsoRequiredWithRecoveryException" ? (
        <div className="space-y-2">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>Recovery administrators</p>
          <ul className="space-y-1">
            {props.recoveryAdmins.map((row) => (
              <li key={row.normalizedRecoveryAdminEmail} className={OPERATOR_TYPOGRAPHY.body}>
                {row.displayRecoveryAdminEmail}
                {row.authenticationVerifiedUtc ? " · verified" : " · not verified"}
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  disabled={props.mutationsBlocked}
                  data-testid={`auth-domains-remove-recovery-${row.normalizedRecoveryAdminEmail}`}
                  onClick={() => void props.handleRemoveRecoveryAdmin(row)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Input
              value={props.recoveryEmail}
              onChange={(event) => props.setRecoveryEmail(event.target.value)}
              placeholder={`breakglass@${props.selected.displayDomain}`}
              aria-label="Recovery administrator email"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={props.mutationsBlocked || !props.recoveryEmail.trim()}
              data-testid="auth-domains-add-recovery-admin"
              onClick={() => void props.handleAddRecoveryAdmin()}
            >
              Add recovery admin
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
