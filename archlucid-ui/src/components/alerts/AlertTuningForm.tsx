"use client";

import { AlertTuningFormFields, type AlertTuningFormFieldsProps } from "@/components/alerts/AlertTuningFormFields";

export type AlertTuningFormProps = AlertTuningFormFieldsProps;

export function AlertTuningForm(props: AlertTuningFormProps) {
  return <AlertTuningFormFields {...props} />;
}
