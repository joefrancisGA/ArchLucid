"use client";

import { cn } from "@/lib/utils";

import {
  API_KEYS_ENTERPRISE_ONLY_NOTICE,
  API_KEYS_PAGE_SUBTITLE,
  API_KEYS_PAGE_TITLE,
  API_KEYS_RECENT_EVENTS_SECTION_TITLE,
  API_KEYS_SSO_ONLY_NOTICE,
} from "@/lib/api-keys-settings-copy";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { Button } from "@/components/ui/button";
import { ApiKeysUsersVocabularyRail } from "@/components/ApiKeysUsersVocabularyRail";
import { DeveloperApiContractsApiKeysVocabularyRail } from "@/components/DeveloperApiContractsApiKeysVocabularyRail";
import { WebhooksApiKeysVocabularyRail } from "@/components/WebhooksApiKeysVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  PageContextualHelpButton,
} from "@/components/usability/PageContextualHelpButton";
import { ApiKeysSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

import { ApiKeysContinueLastViewedRow } from "./ApiKeysContinueLastViewedRow";
import { ApiKeysSettingsBreadcrumb } from "./ApiKeysSettingsBreadcrumb";
import { ApiKeysSettingsBuyerChrome } from "./ApiKeysSettingsBuyerChrome";
import {
  API_KEYS_SETTINGS_PRIMARY_CONTENT_ID,
  API_KEYS_SETTINGS_SKIP_LINK_LABEL,
  apiKeysSettingsPageSubtitle,
} from "./api-keys-settings-page-copy";

import { ApiKeyActionConfirmDialog } from "./ApiKeyActionConfirmDialog";
import { ApiKeyRecentEventsTable } from "./ApiKeyRecentEventsTable";
import { ApiKeyRotateRevealPanel } from "./ApiKeyRotateRevealPanel";
import { ApiKeysSettingsCredentialRows } from "./ApiKeysSettingsCredentialRows";
import { ApiKeysSettingsRestrictedState } from "./ApiKeysSettingsRestrictedState";
import { ApiKeysSettingsSummaryRow } from "./ApiKeysSettingsSummaryRow";
import { ApiKeysSettingsTechnicalDetails } from "./ApiKeysSettingsTechnicalDetails";
import { useApiKeysSettingsPage } from "./use-api-keys-settings-page";

export function ApiKeysSettingsPageClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showTechnicalDetails = isArchLucidInternalOperatorShellEnv();
  const page = useApiKeysSettingsPage();

  if (page.state.status === "blocked") {
    return <ApiKeysSettingsRestrictedState reason="forbidden" />;
  }

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="api-keys-settings-page">
      <a
        href={`#${API_KEYS_SETTINGS_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {API_KEYS_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={API_KEYS_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid="api-keys-settings-primary-content"
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref={SETTINGS_ROOT_PATH}
          title={API_KEYS_PAGE_TITLE}
          headingLevel="h1"
          breadcrumb={buyerPolishedShell ? <ApiKeysSettingsBreadcrumb /> : undefined}
          subtitle={
            buyerPolishedShell ? (
              apiKeysSettingsPageSubtitle(buyerPolishedShell, API_KEYS_PAGE_SUBTITLE)
            ) : (
              <>
                <p className="m-0">{API_KEYS_PAGE_SUBTITLE}</p>
                <p className={cn("m-0 mt-2 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{API_KEYS_ENTERPRISE_ONLY_NOTICE}</p>
              </>
            )
          }
          subtitleClassName="max-w-prose"
          actions={<PageContextualHelpButton />}
        >
          {buyerPolishedShell ? null : (
            <>
              <ApiKeysUsersVocabularyRail currentSurfaceId="api-keys" />
              <WebhooksApiKeysVocabularyRail currentSurfaceId="api-keys" />
              <DeveloperApiContractsApiKeysVocabularyRail currentSurfaceId="api-keys" />
            </>
          )}
        </OperatorPageHeader>

        <ApiKeysSettingsBuyerChrome />

        {!buyerPolishedShell ? <ApiKeysSettingsEvidenceOrientationStrip /> : null}
{page.state.status === "loading" ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading API key status…</p>
      ) : null}

      {page.state.status === "ready" && page.state.settings.enabled === false ? (
        <p className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)} role="status">
          {API_KEYS_SSO_ONLY_NOTICE}
        </p>
      ) : null}

      {page.statusBanner ? (
        <p className={cn("m-0", DESIGN_TOKENS.callout.success, OPERATOR_TYPOGRAPHY.body)} role="status">
          {page.statusBanner}
        </p>
      ) : null}

      <ApiKeysSettingsSummaryRow summary={page.summary} loading={page.state.status === "loading"} />

      {page.state.status === "ready" && page.continueLastCredential !== null ? (
        <ApiKeysContinueLastViewedRow target={page.continueLastCredential} onOpen={page.openCredential} />
      ) : null}

      {page.state.status === "ready" ? (
        <ApiKeysSettingsCredentialRows
          credentialRows={page.credentialRows}
          rotating={page.rotating}
          apiKeysIssueSteps={page.apiKeysIssueSteps}
          apiKeysIssueEmphasizedStepId={page.apiKeysIssueEmphasizedStepId}
          onRememberPendingAction={page.rememberPendingAction}
          onScrollToAudit={() => page.eventsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
      ) : null}

      <section ref={page.eventsSectionRef} className="space-y-3">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{API_KEYS_RECENT_EVENTS_SECTION_TITLE}</h2>
        <ApiKeyRecentEventsTable events={page.auditEvents} />
      </section>

      {page.rotateReveal ? (
        <ApiKeyRotateRevealPanel
          response={page.rotateReveal}
          onDismiss={page.dismissRotateReveal}
        />
      ) : null}

      {showTechnicalDetails && page.state.status === "ready" ? (
        <ApiKeysSettingsTechnicalDetails settings={page.state.settings} rotateResponse={page.rotateReveal} />
      ) : null}

      <ApiKeyActionConfirmDialog
        pendingAction={page.pendingAction}
        busy={page.rotating}
        onCancel={() => page.setPendingAction(null)}
        onConfirm={page.confirmPendingAction}
      />
      </div>
    </OperatorPageContainer>
  );
}
