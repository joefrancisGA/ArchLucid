"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { AzureBoardsIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { ItsmConnectorProviderChooserRail } from "@/components/itsm/ItsmConnectorProviderChooserRail";

import { AzureBoardsConnectionSettingsPanel } from "./AzureBoardsConnectionSettingsPanel";
import { AzureBoardsConnectionStatusPanel } from "./AzureBoardsConnectionStatusPanel";
import { AzureBoardsConnectionTestSection } from "./AzureBoardsConnectionTestSection";
import { AzureBoardsDefaultBehaviorPanel } from "./AzureBoardsDefaultBehaviorPanel";
import { AzureBoardsIntegrationAside } from "./AzureBoardsIntegrationAside";
import { AzureBoardsIntegrationPageHeader } from "./AzureBoardsIntegrationPageHeader";
import { AzureBoardsIntegrationPageLoadingSkeleton } from "./AzureBoardsIntegrationPageLoadingSkeleton";
import { useAzureBoardsIntegrationPage } from "./use-azure-boards-integration-page";

export function AzureBoardsIntegrationPageClient(): React.ReactElement {
  const {
    canMutate,
    showOperatorNotes,
    health,
    saveError,
    connectionSaveError,
    saveSuccess,
    connectionSaveSuccess,
    testError,
    isLoading,
    isSaving,
    isSavingConnection,
    isTesting,
    organizationUrl,
    setOrganizationUrl,
    tokenReference,
    setTokenReference,
    projectName,
    setProjectName,
    workItemType,
    setWorkItemType,
    areaPath,
    setAreaPath,
    iterationPath,
    setIterationPath,
    defaultTags,
    setDefaultTags,
    projects,
    workItemTypes,
    discoveryError,
    lastTestAt,
    lastTestSummary,
    lastTestSuccess,
    lastRefreshedAt,
    isInitialLoad,
    isRefreshing,
    nativeEnabled,
    credentialsReady,
    connectionStatus,
    testGate,
    connectionSaveGate,
    pageComposition,
    integrationZoneRecoveries,
    credentialStatus,
    credentialStatusKind,
    connectionProvenance,
    organizationDisplay,
    connectionTestCollapsedSummary,
    settingsReady,
    handleRefresh,
    saveConnection,
    saveSettings,
    runConnectionTest,
  } = useAzureBoardsIntegrationPage();

  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="integrations-azure-boards-page"
    >
      <AzureBoardsIntegrationPageHeader
        refreshing={isLoading}
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={handleRefresh}
      />

      <ItsmConnectorProviderChooserRail currentProviderId="azure-boards" />
      <AzureBoardsIntegrationEvidenceOrientationStrip />

      {isInitialLoad ? (
        <AzureBoardsIntegrationPageLoadingSkeleton />
      ) : (
        <div
          className={cn(OPERATOR_LAYOUT.majorSectionGap)}
          aria-busy={isLoading}
          data-testid="azure-boards-page-content"
          data-operator-side-rail-kind="none"
        >
          {isRefreshing ? (
            <div
              className="space-y-2"
              data-testid="azure-boards-refresh-skeleton"
              aria-hidden="true"
            >
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
          ) : null}

          <div className={cn("min-w-0", OPERATOR_LAYOUT.majorSectionGap, isRefreshing && "opacity-70")}>
            <AzureBoardsConnectionStatusPanel
              connectionStatus={connectionStatus}
              integrationZoneRecoveries={integrationZoneRecoveries}
            />

            {pageComposition.showConnectionSettings ? (
              <AzureBoardsConnectionSettingsPanel
                canMutate={canMutate}
                organizationUrl={organizationUrl}
                onOrganizationUrlChange={setOrganizationUrl}
                tokenReference={tokenReference}
                onTokenReferenceChange={setTokenReference}
                organizationDisplay={organizationDisplay}
                credentialStatus={credentialStatus}
                credentialStatusKind={credentialStatusKind}
                connectionProvenance={connectionProvenance}
                connectionSaveError={connectionSaveError}
                connectionSaveSuccess={connectionSaveSuccess}
                connectionSaveGate={connectionSaveGate}
                isSavingConnection={isSavingConnection}
                onSaveConnection={() => void saveConnection()}
              />
            ) : null}

            <AzureBoardsDefaultBehaviorPanel
              pageComposition={pageComposition}
              canMutate={canMutate}
              projects={projects}
              workItemTypes={workItemTypes}
              projectName={projectName}
              onProjectNameChange={setProjectName}
              workItemType={workItemType}
              onWorkItemTypeChange={setWorkItemType}
              areaPath={areaPath}
              onAreaPathChange={setAreaPath}
              iterationPath={iterationPath}
              onIterationPathChange={setIterationPath}
              defaultTags={defaultTags}
              onDefaultTagsChange={setDefaultTags}
              discoveryError={discoveryError}
              saveError={saveError}
              saveSuccess={saveSuccess}
              isSaving={isSaving}
              onSaveSettings={() => void saveSettings()}
            />

            <AzureBoardsConnectionTestSection
              pageComposition={pageComposition}
              testGate={testGate}
              testError={testError}
              isTesting={isTesting}
              credentialsReady={credentialsReady}
              connectionTestCollapsedSummary={connectionTestCollapsedSummary}
              onRunConnectionTest={() => void runConnectionTest()}
            />
          </div>

          <AzureBoardsIntegrationAside
            status={connectionStatus}
            credentialsReady={credentialsReady}
            settingsReady={settingsReady}
            connectionVerified={health?.reachable === true}
            lastTestAt={lastTestAt}
            lastTestSummary={lastTestSummary}
            lastTestSuccess={lastTestSuccess}
            showOperatorNotes={showOperatorNotes}
            nativeEnabled={nativeEnabled}
          />
        </div>
      )}
    </OperatorPageContainer>
  );
}
