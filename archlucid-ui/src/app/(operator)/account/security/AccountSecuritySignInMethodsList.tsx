"use client";

import Link from "next/link";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ACCOUNT_SECURITY_EMPTY_METHODS_HELP_CTA,
  ACCOUNT_SECURITY_EMPTY_METHODS_MESSAGE,
  ACCOUNT_SECURITY_INACTIVE_METHOD_HELPER,
  ACCOUNT_SECURITY_RECENT_AUTH_LIST_UNAVAILABLE,
} from "@/lib/account-security-page-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { resolveSignInMethodRemoveBlockedReason } from "@/lib/sign-in-method-remove-blocked-copy";
import type { SignInMethodSummary } from "@/lib/sign-in-methods-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  AccountSecurityFeedbackCallout,
  type AccountSecurityCardFeedback,
} from "./AccountSecurityFeedbackCallout";

export type AccountSecuritySignInMethodsListProps = {
  readonly loading: boolean;
  readonly listLoaded: boolean;
  readonly methods: readonly SignInMethodSummary[];
  readonly blockedForAuth: boolean;
  readonly showRecentAuthGateCallout: boolean;
  readonly busy: boolean;
  readonly listFeedback: AccountSecurityCardFeedback | null;
  readonly authBlockedEmptyProps: React.ComponentProps<typeof EnterpriseCompactEmptyState>;
  readonly onRefresh: () => void;
  readonly onRemoveMethod: (method: SignInMethodSummary) => void;
};

export function AccountSecuritySignInMethodsList(props: AccountSecuritySignInMethodsListProps): React.JSX.Element {
  return (
    <Card data-testid="sign-in-methods-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Sign-in methods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {props.listFeedback ? (
          <AccountSecurityFeedbackCallout
            feedback={props.listFeedback}
            testId="account-security-list-feedback"
            actions={
              props.listFeedback.tone === "blocked" && !props.blockedForAuth ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={props.busy}
                  onClick={() => {
                    props.onRefresh();
                  }}
                >
                  Try again
                </Button>
              ) : null
            }
          />
        ) : null}

        {props.loading ? (
          <div className="space-y-3" data-testid="sign-in-methods-loading">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : props.blockedForAuth && !props.showRecentAuthGateCallout ? (
          <EnterpriseCompactEmptyState {...props.authBlockedEmptyProps} />
        ) : props.showRecentAuthGateCallout && !props.listLoaded ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="sign-in-methods-recent-auth-unavailable"
          >
            {ACCOUNT_SECURITY_RECENT_AUTH_LIST_UNAVAILABLE}
          </p>
        ) : props.listLoaded && props.methods.length === 0 ? (
          <div className="space-y-3" data-testid="account-security-empty-methods">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {ACCOUNT_SECURITY_EMPTY_METHODS_MESSAGE}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="primary" asChild>
                <Link href={inAppHelpHref("authentication-sign-in")}>{ACCOUNT_SECURITY_EMPTY_METHODS_HELP_CTA}</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={props.busy}
                onClick={() => {
                  props.onRefresh();
                }}
              >
                Try again
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  document.getElementById("link-email")?.focus();
                }}
              >
                Add a sign-in method
              </Button>
            </div>
          </div>
        ) : props.listLoaded ? (
          <ul className="m-0 list-none space-y-3 p-0">
            {props.methods.map((method) => (
              <li
                key={method.identityId}
                className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-al-border p-3"
                data-testid={`sign-in-method-${method.identityId}`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                      {method.providerLabel}
                    </p>
                    <BooleanStatusChip value={method.isActive} />
                  </div>
                  {!method.isActive ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`sign-in-method-inactive-helper-${method.identityId}`}
                    >
                      {ACCOUNT_SECURITY_INACTIVE_METHOD_HELPER}
                    </p>
                  ) : null}
                  {method.maskedIdentifier ? (
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                      {method.maskedIdentifier}
                    </p>
                  ) : null}
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Added {formatInstantForLocale(method.addedUtc)}
                    {method.lastUsedUtc ? ` · Last used ${formatInstantForLocale(method.lastUsedUtc)}` : ""}
                  </p>
                  {!method.canRemove ? (
                    <div className="pt-1">
                      <StatusTag kind="neutral" label="Cannot remove" />
                      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {resolveSignInMethodRemoveBlockedReason(method, props.methods)}
                      </p>
                    </div>
                  ) : null}
                </div>
                {method.canRemove ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={props.busy || props.blockedForAuth}
                    data-testid={`sign-in-method-remove-${method.identityId}`}
                    onClick={() => {
                      props.onRemoveMethod(method);
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
