"use client";

import {
  checkTenantAuthDomainVerification,
  startTenantAuthDomainVerification,
  type TenantAuthDomainRecord,
} from "@/lib/admin-auth-domains-api";
import { AUTH_DOMAINS_JOURNEY_SECTION_IDS } from "@/lib/auth-domains-page-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AuthDomainsVerificationPanelProps = {
  readonly selected: TenantAuthDomainRecord;
  readonly dnsInstruction: string | null;
  readonly mutationsBlocked: boolean;
  readonly testEmail: string;
  readonly setTestEmail: (value: string) => void;
  readonly runForSelected: (
    action: (domain: string) => Promise<unknown>,
    successMessage: string,
  ) => Promise<void>;
  readonly handlePreviewRouting: () => Promise<void>;
  readonly handleMarkRoutingTested: () => Promise<void>;
};

export function AuthDomainsVerificationPanel(props: AuthDomainsVerificationPanelProps): React.JSX.Element {
  return (
    <>
        {props.dnsInstruction !== null ? (
          <p
            className={cn(DESIGN_TOKENS.callout.info, OPERATOR_TYPOGRAPHY.helper)}
            data-testid="auth-domains-dns-instruction"
          >
            {props.dnsInstruction}
          </p>
        ) : null}

        <div
          id={AUTH_DOMAINS_JOURNEY_SECTION_IDS["verify-dns"]}
          tabIndex={-1}
          className="flex flex-wrap gap-2 outline-none"
        >
          <Button
            type="button"
            variant="secondary"
            disabled={props.mutationsBlocked}
            data-testid="auth-domains-start-verification"
            onClick={() => void props.runForSelected(startTenantAuthDomainVerification, "DNS verification started")}
          >
            Start verification
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={props.mutationsBlocked}
            data-testid="auth-domains-check-dns"
            onClick={() => void props.runForSelected(checkTenantAuthDomainVerification, "DNS verification checked")}
          >
            Check DNS verification
          </Button>
        </div>

        <div
          id={AUTH_DOMAINS_JOURNEY_SECTION_IDS["test-routing"]}
          tabIndex={-1}
          className="space-y-2 outline-none"
        >
          <label className={OPERATOR_TYPOGRAPHY.label} htmlFor="auth-domains-test-email">
            Routing test email
          </label>
          <Input
            id="auth-domains-test-email"
            value={props.testEmail}
            onChange={(event) => props.setTestEmail(event.target.value)}
            placeholder={`user@${props.selected.displayDomain}`}
            data-testid="auth-domains-test-email"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={props.mutationsBlocked}
              data-testid="auth-domains-preview-routing"
              onClick={() => void props.handlePreviewRouting()}
            >
              Preview routing
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={props.mutationsBlocked}
              data-testid="auth-domains-mark-routing-tested"
              onClick={() => void props.handleMarkRoutingTested()}
            >
              Mark routing tested
            </Button>
          </div>
        </div>
    </>
  );
}
