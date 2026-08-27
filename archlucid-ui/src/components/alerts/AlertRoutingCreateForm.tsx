"use client";

import { cn } from "@/lib/utils";
import type { RefObject } from "react";

import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { AlertRoutingCreateDestinationForm } from "@/components/alerts/AlertRoutingCreateDestinationForm";
import {
  alertRoutingEmptyGettingStartedOperator,
  alertRoutingEmptyGettingStartedReader,
} from "@/lib/alerts-hub-empty-guidance";
import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import type { AlertRoutingCriteria } from "@/lib/alert-routing-criteria";
import type { AlertRoutingFieldErrors } from "@/lib/alert-routing-form";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";

export type AlertRoutingCreateFormProps = {
  readonly formSectionRef: RefObject<HTMLElement | null>;
  readonly isEmptyComposition: boolean;
  readonly canEditRouting: boolean;
  readonly canMutateRouting: boolean;
  readonly creating: boolean;
  readonly formValid: boolean;
  readonly name: string;
  readonly channelType: string;
  readonly destination: string;
  readonly minimumSeverity: string;
  readonly routingCriteria: AlertRoutingCriteria;
  readonly fieldErrors: AlertRoutingFieldErrors;
  readonly thresholdPreview: {
    readonly preview: string;
    readonly criticalExcludedWarning: string | null;
  };
  readonly alertRoutingCreateSteps: readonly IntegrationConnectChecklistStep[];
  readonly alertRoutingCreateEmphasizedStepId: string;
  readonly mutationDisabledReason: WhyDisabledCtaReason | null;
  readonly mutationDisabledHintId: string;
  readonly onNameChange: (value: string) => void;
  readonly onChannelTypeChange: (value: string) => void;
  readonly onDestinationChange: (value: string) => void;
  readonly onMinimumSeverityChange: (value: string) => void;
  readonly onRoutingCriteriaChange: (value: AlertRoutingCriteria) => void;
  readonly onCreate: (sendTestAfterSave: boolean) => void;
  readonly onResetForm: () => void;
};

export function AlertRoutingCreateForm(props: AlertRoutingCreateFormProps): React.JSX.Element {
  return (
    <div
      className={cn(props.isEmptyComposition && "space-y-4")}
      data-testid={props.isEmptyComposition ? "alert-routing-empty-state" : undefined}
    >
      <AlertRoutingCreateDestinationForm
        formSectionRef={props.formSectionRef}
        isEmptyComposition={props.isEmptyComposition}
        canEditRouting={props.canEditRouting}
        canMutateRouting={props.canMutateRouting}
        creating={props.creating}
        formValid={props.formValid}
        name={props.name}
        channelType={props.channelType}
        destination={props.destination}
        minimumSeverity={props.minimumSeverity}
        routingCriteria={props.routingCriteria}
        fieldErrors={props.fieldErrors}
        thresholdPreview={props.thresholdPreview}
        alertRoutingCreateSteps={props.alertRoutingCreateSteps}
        alertRoutingCreateEmphasizedStepId={props.alertRoutingCreateEmphasizedStepId}
        mutationDisabledReason={props.mutationDisabledReason}
        mutationDisabledHintId={props.mutationDisabledHintId}
        onNameChange={props.onNameChange}
        onChannelTypeChange={props.onChannelTypeChange}
        onDestinationChange={props.onDestinationChange}
        onMinimumSeverityChange={props.onMinimumSeverityChange}
        onRoutingCriteriaChange={props.onRoutingCriteriaChange}
        onCreate={(sendTestAfterSave) => {
          props.onCreate(sendTestAfterSave);
        }}
        onResetForm={props.onResetForm}
      />

      {props.isEmptyComposition ? (
        <GettingStartedSteps
          {...(props.canMutateRouting ? alertRoutingEmptyGettingStartedOperator : alertRoutingEmptyGettingStartedReader)}
          className="border-0 bg-transparent px-0 py-0"
          stepLinkByIndex={
            props.canMutateRouting
              ? {
                  3: {
                    href: governanceAlertRulesTabHref("test-alerts"),
                    label: "Test alerts",
                  },
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
