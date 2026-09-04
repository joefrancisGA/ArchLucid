"use client";

import { useAlertRoutingCreate } from "@/components/alerts/use-alert-routing-create";
import { useAlertRoutingList } from "@/components/alerts/use-alert-routing-list";
import { useAlertRoutingTestConnection } from "@/components/alerts/use-alert-routing-test-connection";

export function useAlertRoutingContent() {
  const list = useAlertRoutingList();
  const create = useAlertRoutingCreate({ list });
  const testConnection = useAlertRoutingTestConnection();

  return {
    ...list,
    failure: create.failure,
    statusMessage: create.statusMessage,
    formSectionRef: create.formSectionRef,
    creating: create.creating,
    formValid: create.formValid,
    name: create.name,
    channelType: create.channelType,
    destination: create.destination,
    minimumSeverity: create.minimumSeverity,
    routingCriteria: create.routingCriteria,
    fieldErrors: create.fieldErrors,
    thresholdPreview: create.thresholdPreview,
    alertRoutingCreateSteps: create.alertRoutingCreateSteps,
    alertRoutingCreateEmphasizedStepId: create.alertRoutingCreateEmphasizedStepId,
    mutationDisabledReason: create.mutationDisabledReason,
    mutationDisabledHintId: create.mutationDisabledHintId,
    setName: create.setName,
    onChannelTypeChange: create.onChannelTypeChange,
    setDestination: create.setDestination,
    setMinimumSeverity: create.setMinimumSeverity,
    setRoutingCriteria: create.setRoutingCriteria,
    scrollToForm: create.scrollToForm,
    onCreate: create.onCreate,
    resetCreateForm: create.resetCreateForm,
    testingId: testConnection.testingId,
    onTest: testConnection.onTest,
  };
}

export type UseAlertRoutingContentResult = ReturnType<typeof useAlertRoutingContent>;
