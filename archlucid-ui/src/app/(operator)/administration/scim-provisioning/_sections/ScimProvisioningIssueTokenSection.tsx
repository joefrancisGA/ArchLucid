"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { StatusTag } from "@/components/StatusTag";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { IntegrationConnectChecklist, type IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  parseScimVerifyTechnicalDetailsOpenFromSearch,
  scimVerifyTechnicalDetailsDisclosureHrefFromSearch,
} from "@/lib/administration/scim-verify-technical-details-disclosure-url";
import type { ScimBaseUrlClassification } from "@/lib/scim-provisioning-base-url";
import {
  SCIM_BASE_URL_EXTERNAL_REACHABILITY_WARNING,
  SCIM_BASE_URL_COPIED_ACTION,
  SCIM_BASE_URL_COPY_ACTION,
  SCIM_BASE_URL_LABEL,
  SCIM_CONFIGURE_SECTION_DESCRIPTION,
  SCIM_CONFIGURE_SECTION_TITLE,
  SCIM_COPY_TOKEN_ACTION,
  SCIM_CREATE_TOKEN_ACTION,
  SCIM_CREATING_TOKEN_ACTION,
  SCIM_ONE_TIME_TOKEN_NOTICE,
  SCIM_TOKEN_COPIED_ACTION,
  SCIM_TOKEN_DONE_ACTION,
  SCIM_VERIFY_CREATE_TOKEN_LINK,
  SCIM_VERIFY_DISABLED_MISSING_TOKEN,
  SCIM_VERIFY_MANUAL_TOKEN_HELPER_PREFIX,
  SCIM_VERIFY_MANUAL_TOKEN_HELPER_SUFFIX,
  SCIM_VERIFY_MANUAL_TOKEN_LABEL,
  SCIM_VERIFY_SECTION_DESCRIPTION,
  SCIM_VERIFY_SECTION_TITLE,
  SCIM_VERIFY_ACTION,
  SCIM_VERIFY_STATUS_FAILED,
  SCIM_VERIFY_STATUS_NOT_VERIFIED,
  SCIM_VERIFY_STATUS_VERIFIED,
  SCIM_VERIFY_TECHNICAL_DETAILS_TITLE,
  SCIM_VERIFY_USING_SESSION_TOKEN,
  SCIM_VERIFYING_ACTION,
  SCIM_VERIFY_SUCCESS_DETAIL,
} from "@/lib/scim-provisioning-page-copy";
import { whyDisabledBusy, whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";

export type ScimTokenIssueResponse = {
  id: string;
  publicLookupKey: string;
  plaintextToken: string;
};

export type VerifyState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "verified" }
  | { status: "failed"; message: string; httpStatus?: number };

export type ScimProvisioningIssueTokenSectionProps = {
  readonly scimBaseUrlClassification: ScimBaseUrlClassification | null;
  readonly scimBaseUrl: string;
  readonly issuedToken: ScimTokenIssueResponse | null;
  readonly setupSessionToken: string | null;
  readonly manualVerifyToken: string;
  readonly verifyState: VerifyState;
  readonly issuing: boolean;
  readonly copiedBaseUrl: boolean;
  readonly copiedToken: boolean;
  readonly scimIssueSteps: readonly IntegrationConnectChecklistStep[];
  readonly scimIssueEmphasizedStepId: string;
  readonly onCopyScimBaseUrl: () => void;
  readonly onRequestCreate: () => void;
  readonly onCopyIssuedToken: () => void;
  readonly onClearSetupSession: () => void;
  readonly onManualVerifyTokenChange: Dispatch<SetStateAction<string>>;
  readonly onVerifyConnection: () => void;
};

function resolveVerifyStatusTag(verifyState: VerifyState): { kind: EnterpriseStatusKind; label: string } {
  switch (verifyState.status) {
    case "verified":
      return { kind: "ready", label: SCIM_VERIFY_STATUS_VERIFIED };
    case "failed":
      return { kind: "blocked", label: SCIM_VERIFY_STATUS_FAILED };
    case "checking":
      return { kind: "in-progress", label: SCIM_VERIFYING_ACTION };
    case "idle":
      return { kind: "neutral", label: SCIM_VERIFY_STATUS_NOT_VERIFIED };
    default: {
      const _exhaustive: never = verifyState;
      return _exhaustive;
    }
  }
}

function focusCreateTokenControl(): void {
  const element = document.querySelector<HTMLElement>('[data-testid="scim-create-token"]');

  if (element === null) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.focus();
}

export function ScimProvisioningIssueTokenSection(
  props: ScimProvisioningIssueTokenSectionProps,
): React.JSX.Element {
  const {
    scimBaseUrlClassification,
    scimBaseUrl,
    issuedToken,
    setupSessionToken,
    manualVerifyToken,
    verifyState,
    issuing,
    copiedBaseUrl,
    copiedToken,
    scimIssueSteps,
    scimIssueEmphasizedStepId,
    onCopyScimBaseUrl,
    onRequestCreate,
    onCopyIssuedToken,
    onClearSetupSession,
    onManualVerifyTokenChange,
    onVerifyConnection,
  } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/scim-provisioning";
  const searchParams = useSearchParams();
  const scimVerifyTechnicalDetailsOpenParam = searchParams.get("scimVerifyTechnicalDetailsOpen");
  const [verifyTechnicalDetailsOpen, setVerifyTechnicalDetailsOpenState] = useState(() =>
    parseScimVerifyTechnicalDetailsOpenFromSearch(scimVerifyTechnicalDetailsOpenParam),
  );

  const syncVerifyTechnicalDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        scimVerifyTechnicalDetailsDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setVerifyTechnicalDetailsOpen = useCallback(
    (open: boolean) => {
      setVerifyTechnicalDetailsOpenState(open);
      syncVerifyTechnicalDetailsOpenToUrl(open);
    },
    [syncVerifyTechnicalDetailsOpenToUrl],
  );

  useEffect(() => {
    setVerifyTechnicalDetailsOpenState(
      parseScimVerifyTechnicalDetailsOpenFromSearch(scimVerifyTechnicalDetailsOpenParam),
    );
  }, [scimVerifyTechnicalDetailsOpenParam]);

  const verifyTokenValue =
    setupSessionToken !== null && setupSessionToken.trim().length > 0
      ? setupSessionToken.trim()
      : manualVerifyToken.trim();
  const verifyStatusTag = resolveVerifyStatusTag(verifyState);
  const verifyDisabled = verifyState.status === "checking" || verifyTokenValue.length === 0;
  const verifyDisabledReason =
    verifyState.status === "checking"
      ? whyDisabledBusy(SCIM_VERIFYING_ACTION)
      : verifyTokenValue.length === 0
        ? whyDisabledIncompleteInput(SCIM_VERIFY_DISABLED_MISSING_TOKEN)
        : null;
  const scimBaseUrlCopyDisabled =
    scimBaseUrl.length === 0 || (scimBaseUrlClassification?.requiresExternalReachabilityWarning ?? false);
  const showManualVerifyField = setupSessionToken === null && issuedToken === null;
  const createDisabled = issuing || issuedToken !== null;

  return (
    <>
      <Card data-testid="scim-configure-section">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SCIM_CONFIGURE_SECTION_TITLE}</CardTitle>
          <CardDescription>{SCIM_CONFIGURE_SECTION_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <IntegrationConnectChecklist
            title="Issue token checklist"
            steps={scimIssueSteps}
            emphasizedStepId={scimIssueEmphasizedStepId}
            testIdPrefix="scim-issue-token"
          />
          {scimBaseUrlClassification?.requiresExternalReachabilityWarning === true ? (
            <div data-testid="scim-base-url-reachability-warning">
              <OperatorApiProblem
                fallbackMessage={SCIM_BASE_URL_EXTERNAL_REACHABILITY_WARNING}
                problem={null}
                variant="warning"
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="scim-base-url">{SCIM_BASE_URL_LABEL}</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Input
                id="scim-base-url"
                readOnly
                value={scimBaseUrl}
                className="font-mono text-sm"
                data-testid="scim-base-url-input"
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => void onCopyScimBaseUrl()}
                disabled={scimBaseUrlCopyDisabled}
                data-testid="scim-base-url-copy"
              >
                {copiedBaseUrl ? SCIM_BASE_URL_COPIED_ACTION : SCIM_BASE_URL_COPY_ACTION}
              </Button>
            </div>
          </div>

          {issuedToken === null ? (
            <Button
              type="button"
              variant="primary"
              onClick={onRequestCreate}
              disabled={createDisabled}
              data-testid="scim-create-token"
            >
              {issuing ? SCIM_CREATING_TOKEN_ACTION : SCIM_CREATE_TOKEN_ACTION}
            </Button>
          ) : (
            <div
              className={cn(
                "space-y-3 rounded-md border border-amber-600/40 bg-al-surface-raised p-4 dark:border-amber-700/50",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="scim-token-reveal"
            >
              <p className={cn("m-0 font-medium text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {SCIM_ONE_TIME_TOKEN_NOTICE}
              </p>
              <label className="block space-y-1">
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>SCIM token</span>
                <textarea
                  className={cn(
                    "w-full rounded-md border border-neutral-300 bg-white/80 p-2 font-mono dark:border-neutral-600 dark:bg-neutral-900/80",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                  readOnly
                  rows={2}
                  value={issuedToken.plaintextToken}
                  data-testid="scim-token-plaintext"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void onCopyIssuedToken()}>
                  {copiedToken ? SCIM_TOKEN_COPIED_ACTION : SCIM_COPY_TOKEN_ACTION}
                </Button>
                <Button type="button" variant="primary" onClick={onClearSetupSession} data-testid="scim-token-done">
                  {SCIM_TOKEN_DONE_ACTION}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="scim-verify-section">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SCIM_VERIFY_SECTION_TITLE}</CardTitle>
            <StatusTag
              kind={verifyStatusTag.kind}
              label={verifyStatusTag.label}
              data-testid="scim-verify-status-tag"
            />
          </div>
          <CardDescription>{SCIM_VERIFY_SECTION_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupSessionToken !== null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="scim-verify-session-hint">
              {SCIM_VERIFY_USING_SESSION_TOKEN}
            </p>
          ) : null}

          {showManualVerifyField ? (
            <div className="space-y-1.5">
              <Label htmlFor="scim-verify-token">{SCIM_VERIFY_MANUAL_TOKEN_LABEL}</Label>
              <Input
                id="scim-verify-token"
                type="password"
                autoComplete="off"
                value={manualVerifyToken}
                onChange={(event) => {
                  onManualVerifyTokenChange(event.currentTarget.value);
                }}
                data-testid="scim-verify-token-input"
              />
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {SCIM_VERIFY_MANUAL_TOKEN_HELPER_PREFIX}{" "}
                <button
                  type="button"
                  className={OPERATOR_LINK.nav}
                  onClick={focusCreateTokenControl}
                  data-testid="scim-verify-create-token-link"
                >
                  {SCIM_VERIFY_CREATE_TOKEN_LINK}
                </button>{" "}
                {SCIM_VERIFY_MANUAL_TOKEN_HELPER_SUFFIX}
              </p>
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => void onVerifyConnection()}
            disabled={verifyDisabled}
            data-testid="scim-verify-connection"
          >
            {verifyState.status === "checking" ? SCIM_VERIFYING_ACTION : SCIM_VERIFY_ACTION}
          </Button>

          <WhyDisabledCtaHint
            id="scim-verify-connection-disabled-hint"
            reason={verifyDisabled ? verifyDisabledReason : null}
            testId="scim-verify-connection-disabled-hint"
          />

          {verifyState.status === "verified" ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="scim-verify-success"
            >
              {SCIM_VERIFY_SUCCESS_DETAIL}
            </p>
          ) : null}

          {verifyState.status === "failed" ? (
            <div className="space-y-2" data-testid="scim-verify-failure">
              <OperatorApiProblem fallbackMessage={verifyState.message} problem={null} variant="error" />
              {verifyState.httpStatus !== undefined ? (
                <CollapsibleSection
                  title={SCIM_VERIFY_TECHNICAL_DETAILS_TITLE}
                  open={verifyTechnicalDetailsOpen}
                  onToggle={setVerifyTechnicalDetailsOpen}
                >
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                    Response status: {verifyState.httpStatus}
                  </p>
                </CollapsibleSection>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
