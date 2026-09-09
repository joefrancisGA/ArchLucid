"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  IDENTITY_PROVIDERS_SAML_PAGE_TITLE,
  IDENTITY_PROVIDERS_SAML_TEST_MAPPING_UNSAVED_NOTICE,
  identityProvidersSamlPageSubtitle,
} from "@/lib/identity-providers-settings-copy";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ArchLucidSamlSpValuesCard } from "./ArchLucidSamlSpValuesCard";
import { AuthTokenTestMappingCard } from "./AuthTokenTestMappingCard";
import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import { IdentityProvidersSamlBreadcrumb } from "./IdentityProvidersSamlBreadcrumb";
import { IdentityProvidersSamlBuyerChrome } from "./IdentityProvidersSamlBuyerChrome";
import { IdentityProvidersSamlSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";
import {
  SAML_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  SAML_SETTINGS_PRIMARY_CONTENT_ID,
  SAML_SETTINGS_SKIP_LINK_LABEL,
  SAML_SETTINGS_SKIP_TARGET_ID,
} from "./saml-settings-page-copy";
import { SamlOperationalHealthStrip } from "./SamlOperationalHealthStrip";
import { SamlSpConfigurationForm } from "./SamlSpConfigurationForm";

export function IdentityProvidersSamlPageClient(): React.JSX.Element {
  const [hasUnsavedSamlEdits, setHasUnsavedSamlEdits] = useState(false);
  const documentGuards = useLivelihoodDocumentGuards({ when: hasUnsavedSamlEdits });
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <IdentityProvidersSettingsGate>
      {(model) => {
        const samlWorkspaceBody = (
          <>
            {buyerPolishedShell ? (
              <IdentityProvidersSamlBuyerChrome />
            ) : (
              <IdentityProvidersSamlSettingsEvidenceOrientationStrip />
            )}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-start">
              <div className="space-y-4">
                {model.samlOperationalHealthLoaded ? (
                  <SamlOperationalHealthStrip
                    payload={model.samlOperationalHealth}
                    fetchNote={model.samlOperationalHealthNote}
                  />
                ) : null}
                <SamlSpConfigurationForm onDirtyChange={setHasUnsavedSamlEdits} />
                <AuthTokenTestMappingCard
                  unsavedEditsNotice={
                    hasUnsavedSamlEdits ? IDENTITY_PROVIDERS_SAML_TEST_MAPPING_UNSAVED_NOTICE : null
                  }
                />
              </div>
              <ArchLucidSamlSpValuesCard />
            </div>
            <LivelihoodDocumentGuardDialog
              open={documentGuards.dialogOpen}
              message={documentGuards.dialogMessage}
              onConfirmLeave={documentGuards.confirmLeave}
              onCancelLeave={documentGuards.cancelLeave}
            />
          </>
        );

        return (
          <IdentityProvidersSettingsShell
            pageTitle={IDENTITY_PROVIDERS_SAML_PAGE_TITLE}
            pageSubtitle={identityProvidersSamlPageSubtitle(buyerPolishedShell)}
            overview={model.overview}
            statusBadgeReady={model.dataLoaded}
            refreshing={model.refreshing}
            lastRefreshedAt={model.lastRefreshedAt}
            diagnosticsDataUnavailable={model.diagnosticsDataUnavailable}
            headerBreadcrumb={buyerPolishedShell ? <IdentityProvidersSamlBreadcrumb /> : undefined}
            primaryContentId={buyerPolishedShell ? SAML_SETTINGS_PRIMARY_CONTENT_ID : undefined}
            skipTargetId={buyerPolishedShell ? SAML_SETTINGS_SKIP_TARGET_ID : undefined}
            skipLinkLabel={buyerPolishedShell ? SAML_SETTINGS_SKIP_LINK_LABEL : undefined}
            onRefresh={() => void model.refresh()}
            showAdminFallbackNotice={buyerPolishedShell ? undefined : true}
          >
            {buyerPolishedShell ? (
              <div
                id={SAML_SETTINGS_SKIP_TARGET_ID}
                data-testid={SAML_SETTINGS_FIRST_VIEWPORT_TEST_ID}
                className={cn(
                  "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                  OPERATOR_LAYOUT.sectionStack,
                )}
              >
                {samlWorkspaceBody}
              </div>
            ) : (
              samlWorkspaceBody
            )}
          </IdentityProvidersSettingsShell>
        );
      }}
    </IdentityProvidersSettingsGate>
  );
}
