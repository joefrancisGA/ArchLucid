"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ReportProblemContext } from "@/lib/report-problem-context";
import type { SubmitReportProblemIntakeResult } from "@/lib/api/report-problem-intake-api";
import { showError } from "@/lib/toast";

export type ReportProblemSubmitPayload = {
  readonly context: ReportProblemContext;
  readonly operatorNote: string | null;
  readonly consentGranted: boolean;
  readonly attachSupportBundle: boolean;
};

export type ReportProblemSubmitResult = Pick<
  SubmitReportProblemIntakeResult,
  "referenceId" | "supportBundleAttachWarning"
>;

type ReportProblemDialogPhase = "form" | "acknowledged";

export function useReportProblemDialog(props: {
  readonly open: boolean;
  readonly context: ReportProblemContext;
  readonly onSubmit: (payload: ReportProblemSubmitPayload) => Promise<ReportProblemSubmitResult>;
}) {
  const { open, context, onSubmit } = props;
  const [phase, setPhase] = useState<ReportProblemDialogPhase>("form");
  const [operatorNote, setOperatorNote] = useState("");
  const [consentGranted, setConsentGranted] = useState(false);
  const [attachSupportBundle, setAttachSupportBundle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [supportBundleAttachWarning, setSupportBundleAttachWarning] = useState<string | null>(null);

  const trimmedNote = operatorNote.trim();
  const submitDisabled = !consentGranted || submitting;

  const submitPayload = useMemo(
    (): ReportProblemSubmitPayload => ({
      context,
      operatorNote: trimmedNote.length > 0 ? trimmedNote : null,
      consentGranted,
      attachSupportBundle,
    }),
    [attachSupportBundle, consentGranted, context, trimmedNote],
  );

  const resetDialogState = useCallback((): void => {
    setPhase("form");
    setOperatorNote("");
    setConsentGranted(false);
    setAttachSupportBundle(false);
    setSubmitting(false);
    setReferenceId(null);
    setSupportBundleAttachWarning(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetDialogState();
    }
  }, [open, resetDialogState]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!consentGranted || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await onSubmit(submitPayload);
      const resolvedReferenceId = result.referenceId.trim();

      if (resolvedReferenceId.length === 0) {
        showError("Report could not be submitted. Try again or email support.");

        return;
      }

      setReferenceId(resolvedReferenceId);
      setSupportBundleAttachWarning(result.supportBundleAttachWarning);
      setPhase("acknowledged");
    } catch {
      showError("Report could not be submitted. Try again or email support.");
    } finally {
      setSubmitting(false);
    }
  }, [consentGranted, onSubmit, submitPayload, submitting]);

  return {
    phase,
    operatorNote,
    setOperatorNote,
    consentGranted,
    setConsentGranted,
    attachSupportBundle,
    setAttachSupportBundle,
    submitting,
    referenceId,
    supportBundleAttachWarning,
    submitDisabled,
    handleSubmit,
  };
}
