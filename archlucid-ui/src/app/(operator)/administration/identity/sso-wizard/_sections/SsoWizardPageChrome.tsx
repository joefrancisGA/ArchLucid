"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { IdentityProvidersSsoWizardVocabularyRail } from "@/components/IdentityProvidersSsoWizardVocabularyRail";
import { SsoWizardScimVocabularyRail } from "@/components/SsoWizardScimVocabularyRail";
import {
  PAGE_HELP_SHORT_TRIGGER_TEXT,
  PageContextualHelpButton,
} from "@/components/usability/PageContextualHelpButton";
import { SsoWizardSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  SSO_WIZARD_BACK_LINK_LABEL,
  SSO_WIZARD_CANCEL_UNSAVED_CONFIRM,
  SSO_WIZARD_CONFIGURATION_EFFECT_LINE_PREFIX,
  SSO_WIZARD_CONFIGURATION_EFFECT_LINE_SUFFIX,
  SSO_WIZARD_EXISTING_CONFIG_LOADING,
  SSO_WIZARD_IDENTITY_PROVIDERS_HREF,
  SSO_WIZARD_PAGE_TITLE,
  SSO_WIZARD_PLATFORM_CONFIGURATION_CHANGE_LINK_HREF,
  SSO_WIZARD_PLATFORM_CONFIGURATION_CHANGE_LINK_LABEL,
  SSO_WIZARD_POST_SAVE_HELP_LINK_HREF,
  SSO_WIZARD_POST_SAVE_HELP_LINK_LABEL,
  SSO_WIZARD_POST_SAVE_NEXT_ACTION_LINK_HREF,
  SSO_WIZARD_POST_SAVE_NEXT_ACTION_LINK_LABEL,
  SSO_WIZARD_POST_SAVE_NEXT_ACTION_PREFIX,
  SSO_WIZARD_RELATED_SURFACES_DISCLOSURE_TITLE,
  ssoWizardPageSubtitle,
} from "@/lib/sso-wizard-copy";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SSO_WIZARD_SETTINGS_FIRST_VIEWPORT_TEST_ID,
} from "@/lib/sso-wizard-settings-page-copy";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";

import { SsoWizardBuyerChrome } from "./SsoWizardBuyerChrome";
import {
  parseSsoWizardRelatedSurfacesOpenFromSearch,
  ssoWizardRelatedSurfacesDisclosureHrefFromSearch,
} from "@/lib/administration/sso-wizard-related-surfaces-disclosure-url";

import { SsoWizardExistingConfigSummary } from "./SsoWizardExistingConfigSummary";
import { SsoWizardStepper } from "./SsoWizardStepper";
import type { UseSsoWizardPageResult } from "./use-sso-wizard-page";

type Props = Pick<
  UseSsoWizardPageResult,
  | "existingConfigLoading"
  | "existingConfigLoadError"
  | "existingConfigSummary"
  | "wizardSession"
  | "step"
  | "completedSteps"
  | "handleStepSelect"
  | "configurationSaved"
  | "setupChecklistSteps"
  | "setupChecklistEmphasizedStepId"
  | "error"
  | "successMessage"
  | "pendingCancelConfirm"
  | "setPendingCancelConfirm"
  | "leaveWizard"
>;

function SsoWizardRelatedSurfacesDisclosure() {
  const router = useRouter();
  const pathname = usePathname() ?? SSO_WIZARD_CANONICAL_PATH;
  const searchParams = useSearchParams();
  const ssoWizardRelatedSurfacesOpenParam = searchParams.get("ssoWizardRelatedSurfacesOpen");
  const [open, setOpenState] = useState(() =>
    parseSsoWizardRelatedSurfacesOpenFromSearch(ssoWizardRelatedSurfacesOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        ssoWizardRelatedSurfacesDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseSsoWizardRelatedSurfacesOpenFromSearch(ssoWizardRelatedSurfacesOpenParam));
  }, [ssoWizardRelatedSurfacesOpenParam]);

  return (
    <details
      className="rounded-lg border border-neutral-200 dark:border-neutral-800"
      data-testid="sso-wizard-related-surfaces-disclosure"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer px-4 py-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {SSO_WIZARD_RELATED_SURFACES_DISCLOSURE_TITLE}
      </summary>
      <div className="space-y-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <IdentityProvidersSsoWizardVocabularyRail currentSurfaceId="sso-wizard" />
        <SsoWizardScimVocabularyRail currentSurfaceId="sso-wizard" />
      </div>
    </details>
  );
}

export function SsoWizardPageChrome({
  existingConfigLoading,
  existingConfigLoadError,
  existingConfigSummary,
  wizardSession,
  step,
  completedSteps,
  handleStepSelect,
  configurationSaved,
  setupChecklistSteps,
  setupChecklistEmphasizedStepId,
  error,
  successMessage,
  pendingCancelConfirm,
  setPendingCancelConfirm,
  leaveWizard,
}: Props) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <>
      <header className="space-y-3">
        {!buyerPolishedShell ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <Link href={SSO_WIZARD_IDENTITY_PROVIDERS_HREF} className={OPERATOR_LINK.nav} data-testid="sso-wizard-back-link">
              ← {SSO_WIZARD_BACK_LINK_LABEL}
            </Link>
          </p>
        ) : null}

        <OperatorPageHeader
          navHref={SSO_WIZARD_CANONICAL_PATH}
          title={SSO_WIZARD_PAGE_TITLE}
          subtitle={ssoWizardPageSubtitle(buyerPolishedShell)}
          titleTestId="sso-wizard-page-title"
          actions={
            buyerPolishedShell ? null : (
              <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
            )
          }
        />

        <div
          id={buyerPolishedShell ? SSO_WIZARD_SETTINGS_FIRST_VIEWPORT_TEST_ID : undefined}
          data-testid={buyerPolishedShell ? SSO_WIZARD_SETTINGS_FIRST_VIEWPORT_TEST_ID : undefined}
          className={cn(
            buyerPolishedShell
              ? cn("scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800", OPERATOR_LAYOUT.sectionStack)
              : "space-y-3",
          )}
        >
          {buyerPolishedShell ? <SsoWizardBuyerChrome /> : null}

          {!buyerPolishedShell ? <SsoWizardSettingsEvidenceOrientationStrip /> : null}

          <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
            {SSO_WIZARD_CONFIGURATION_EFFECT_LINE_PREFIX}{" "}
            <Link
              href={SSO_WIZARD_PLATFORM_CONFIGURATION_CHANGE_LINK_HREF}
              className={OPERATOR_LINK.inline}
              data-testid="sso-wizard-platform-change-link"
            >
              {SSO_WIZARD_PLATFORM_CONFIGURATION_CHANGE_LINK_LABEL}
            </Link>
            {SSO_WIZARD_CONFIGURATION_EFFECT_LINE_SUFFIX}
          </p>
        </div>
      </header>

      {existingConfigLoading ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {SSO_WIZARD_EXISTING_CONFIG_LOADING}
        </p>
      ) : null}

      {existingConfigLoadError !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {existingConfigLoadError}
        </p>
      ) : null}

      {existingConfigSummary !== null ? (
        <SsoWizardExistingConfigSummary summary={existingConfigSummary} />
      ) : null}

      {wizardSession.pendingRestore !== null ? (
        <WizardSessionResumePrompt
          onResume={wizardSession.acceptRestore}
          onDismiss={wizardSession.dismissRestore}
        />
      ) : null}

      {wizardSession.saveState !== "idle" ? (
        <div className="flex justify-end">
          <WizardSessionSaveStatus saveState={wizardSession.saveState} />
        </div>
      ) : null}

      <SsoWizardStepper
        currentStep={step}
        completedSteps={completedSteps}
        onStepSelect={handleStepSelect}
      />

      {!configurationSaved ? (
        <IntegrationConnectChecklist
          title="Complete setup checklist"
          steps={setupChecklistSteps}
          emphasizedStepId={setupChecklistEmphasizedStepId}
          testIdPrefix="sso-wizard-complete-setup"
        />
      ) : null}

      {error !== null ? (
        <OperatorMutationInlineError message={error} testId="sso-wizard-mutation-inline-error" />
      ) : null}

      {successMessage !== null ? (
        <OperatorSuccessCallout message={successMessage} testId="sso-wizard-success-callout" />
      ) : null}

      {configurationSaved ? (
        <div
          className={cn(
            "rounded-md border border-neutral-200 px-3 py-3 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="sso-wizard-post-save-next-action"
        >
          <p className="m-0 text-al-text-primary">
            {SSO_WIZARD_POST_SAVE_NEXT_ACTION_PREFIX}{" "}
            <Link href={SSO_WIZARD_POST_SAVE_NEXT_ACTION_LINK_HREF} className={OPERATOR_LINK.inline}>
              {SSO_WIZARD_POST_SAVE_NEXT_ACTION_LINK_LABEL}
            </Link>
            .{" "}
            <Link href={SSO_WIZARD_POST_SAVE_HELP_LINK_HREF} className={OPERATOR_LINK.inline}>
              {SSO_WIZARD_POST_SAVE_HELP_LINK_LABEL}
            </Link>
            .
          </p>
        </div>
      ) : null}

      {!buyerPolishedShell ? <SsoWizardRelatedSurfacesDisclosure /> : null}

      <ConfirmationDialog
        open={pendingCancelConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setPendingCancelConfirm(false);
          }
        }}
        title="Leave SSO setup?"
        description={SSO_WIZARD_CANCEL_UNSAVED_CONFIRM}
        confirmLabel="Leave without saving"
        variant="destructive"
        onConfirm={() => {
          setPendingCancelConfirm(false);
          leaveWizard();
        }}
      />
    </>
  );
}
