"use client";

import type { TeamsNotificationsIntegrationPageServerLoad } from "./load-teams-notifications-integration-page-data";
import { TeamsNotificationsIntegrationPageView } from "./TeamsNotificationsIntegrationPageView";
import { useTeamsNotificationsIntegrationPage } from "./use-teams-notifications-integration-page";
import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";

type Props = {
  readonly loaded: TeamsNotificationsIntegrationPageServerLoad;
};

/** Client root; GET pair is prefetched from `page.tsx` outside demo mode. */
export function TeamsNotificationsIntegrationPageClient(props: Props) {
  const model = useTeamsNotificationsIntegrationPage(props.loaded);
  const documentGuards = useLivelihoodDocumentGuards({ when: model.hasUnsavedEdits });

  return (
    <>
      <TeamsNotificationsIntegrationPageView model={model} />
      <LivelihoodDocumentGuardDialog
        open={documentGuards.dialogOpen}
        message={documentGuards.dialogMessage}
        onConfirmLeave={documentGuards.confirmLeave}
        onCancelLeave={documentGuards.cancelLeave}
      />
    </>
  );
}
