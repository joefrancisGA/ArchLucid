"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { OperatorJwtBearerRoleMappingCallout } from "@/components/OperatorJwtBearerRoleMappingCallout";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ACCESS_DENIED_BODY,
  ACCESS_DENIED_HEADING,
  ACCESS_DENIED_REQUIRED_ROLES,
  ACCESS_DENIED_SUPPLEMENT_COPY,
  formatAccessDeniedSupportTimestamp,
  formatAccessDeniedTenantLabel,
  resolveAccessDeniedSupplementMessage,
  resolveAdministratorContactHref,
} from "@/lib/access-denied-context";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { clearOidcSession, isLikelySignedIn, readSignedInDisplayName, signOutAndRedirectHome } from "@/lib/oidc/session";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";

/**
 * Customer-facing 403 surface for authenticated principals without a recognized ArchLucid app role.
 */
export function OperatorAccessDeniedPageClient() {
  const { currentPrincipal } = useOperatorNavAuthority();
  const [supportTimestamp, setSupportTimestamp] = useState<string | null>(null);
  const [administratorContactHref, setAdministratorContactHref] = useState<string | null>(null);

  const correlationId = useMemo(() => ensureCorrelationId(null), []);
  const supplementMessage = resolveAccessDeniedSupplementMessage(currentPrincipal, {
    jwtSignedIn: isJwtAuthMode() && isLikelySignedIn(),
  });
  const signedInAccount =
    currentPrincipal.name?.trim()
    || readSignedInDisplayName()
    || null;
  const tenantLabel = formatAccessDeniedTenantLabel(readOperatorScopeFromStorage());
  const showJwtAdminCallout = isJwtAuthMode() && isLikelySignedIn();

  useEffect(() => {
    setSupportTimestamp(
      formatAccessDeniedSupportTimestamp(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone),
    );
    setAdministratorContactHref(resolveAdministratorContactHref());
  }, []);

  const handleReturnToSignIn = (): void => {
    clearOidcSession();
    window.location.assign("/auth/signin");
  };

  return (
    <Card
      className="w-full max-w-[560px] border-neutral-200/80 bg-white/95 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/95"
      data-testid="operator-access-denied-page"
    >
      <CardContent className={cn(OPERATOR_CARD_BODY, "text-center sm:text-left")}>
        <h1
          className={cn("font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}
          data-testid="operator-access-denied-heading"
        >
          {ACCESS_DENIED_HEADING}
        </h1>

        <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{ACCESS_DENIED_BODY}</p>

        {supplementMessage !== null ? (
          <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="operator-access-denied-supplement">
            {ACCESS_DENIED_SUPPLEMENT_COPY[supplementMessage]}
          </p>
        ) : null}

        <div className={cn("mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center", OPERATOR_LAYOUT.controlClusterGap)}>
          <Button
            type="button"
            variant="primary"
            size="sm"
            data-testid="operator-access-denied-use-different-account"
            onClick={() => {
              void signOutAndRedirectHome();
            }}
          >
            Use a different account
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="operator-access-denied-return-sign-in"
            onClick={handleReturnToSignIn}
          >
            Return to sign-in
          </Button>
          {administratorContactHref !== null ? (
            <Link
              className={cn(OPERATOR_LINK.nav, "text-sm")}
              href={administratorContactHref}
              data-testid="operator-access-denied-contact-administrator"
            >
              Contact administrator
            </Link>
          ) : null}
        </div>

        <details className={cn("mt-8 text-left", OPERATOR_TYPOGRAPHY.helper)} data-testid="operator-access-denied-admin-details">
          <summary className="cursor-pointer select-none text-al-text-secondary hover:text-al-text-primary">
            Details for administrators
          </summary>
          <div className="mt-3 space-y-2 text-al-text-secondary">
            <p className="m-0">{ACCESS_DENIED_REQUIRED_ROLES}</p>
            {showJwtAdminCallout ? (
              <div className="text-left">
                <OperatorJwtBearerRoleMappingCallout testId="operator-access-denied-jwt-role-callout" />
              </div>
            ) : null}
          </div>
        </details>

        <div
          className={cn("mt-6 space-y-1 text-left text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="operator-access-denied-support-details"
        >
          {signedInAccount !== null ? (
            <p className="m-0">
              <span className="font-medium text-al-text-primary">Signed-in account:</span> {signedInAccount}
            </p>
          ) : null}
          {tenantLabel !== null ? (
            <p className="m-0">
              <span className="font-medium text-al-text-primary">Tenant:</span> {tenantLabel}
            </p>
          ) : null}
          {supportTimestamp !== null ? (
            <p className="m-0">
              Support details: Request ID {correlationId} · {supportTimestamp}
            </p>
          ) : (
            <p className="m-0">Support details: Request ID {correlationId}</p>
          )}
        </div>

        <FatalPageReportProblemSupportRow
          surfaceId="operator-role-gate-session-break"
          errorTitle={ACCESS_DENIED_HEADING}
          correlationId={correlationId}
          errorCode="access-denied"
        />
      </CardContent>
    </Card>
  );
}

const OPERATOR_CARD_BODY = "p-6 sm:p-8";
