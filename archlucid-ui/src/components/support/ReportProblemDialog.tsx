"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { ReportProblemDialogHelpHubVocabularyRail } from "@/components/ReportProblemDialogHelpHubVocabularyRail";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReportProblemContext } from "@/lib/report-problem-context";
import type { SubmitReportProblemIntakeResult } from "@/lib/api/report-problem-intake-api";
import {
  formatReportProblemAcknowledgement,
  REPORT_PROBLEM_ACK_HEADING,
  REPORT_PROBLEM_API_UI_MISMATCH_HINT,
  REPORT_PROBLEM_ATTACH_BUNDLE_HELP_HREF,
  REPORT_PROBLEM_ATTACH_BUNDLE_HELP_LINK_LABEL,
  REPORT_PROBLEM_ATTACH_BUNDLE_HINT,
  REPORT_PROBLEM_ATTACH_BUNDLE_LABEL,
  REPORT_PROBLEM_CANCEL_LABEL,
  REPORT_PROBLEM_CONSENT_LABEL,
  REPORT_PROBLEM_DETAILS_SUMMARY_LABEL,
  REPORT_PROBLEM_DIALOG_DESCRIPTION,
  REPORT_PROBLEM_DIALOG_TITLE,
  REPORT_PROBLEM_FIELD_LABEL_API_COMMIT,
  REPORT_PROBLEM_FIELD_LABEL_BROWSER,
  REPORT_PROBLEM_FIELD_LABEL_DEPLOY_STAMP,
  REPORT_PROBLEM_FIELD_LABEL_ENVIRONMENT,
  REPORT_PROBLEM_FIELD_LABEL_ERROR,
  REPORT_PROBLEM_FIELD_LABEL_PRODUCT_VERSION,
  REPORT_PROBLEM_FIELD_LABEL_REFERENCE_ID,
  REPORT_PROBLEM_FIELD_LABEL_REVIEW_ID,
  REPORT_PROBLEM_FIELD_LABEL_ROUTE,
  REPORT_PROBLEM_FIELD_LABEL_UI_COMMIT,
  REPORT_PROBLEM_FIELD_LABEL_WORKSPACE,
  REPORT_PROBLEM_MISSING_VALUE,
  REPORT_PROBLEM_NOTE_LABEL,
  REPORT_PROBLEM_NOTE_PLACEHOLDER,
  REPORT_PROBLEM_OPERATOR_NOTE_MAX_LENGTH,
  REPORT_PROBLEM_SUBMIT_LABEL,
  REPORT_PROBLEM_SUMMARY_TITLE,
} from "@/lib/report-problem-copy";
import { formatShortCommitSha } from "@/lib/deployment-fingerprint";
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

export type ReportProblemDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly context: ReportProblemContext;
  readonly onSubmit: (payload: ReportProblemSubmitPayload) => Promise<ReportProblemSubmitResult>;
};

type ReportProblemDialogPhase = "form" | "acknowledged";

export function resolveReportProblemReferenceId(context: ReportProblemContext): string | null {
  const correlationId = context.correlationId?.trim() ?? "";

  if (correlationId.length > 0) {
    return correlationId;
  }

  const clientRequestId = context.clientRequestId?.trim() ?? "";

  if (clientRequestId.length > 0) {
    return clientRequestId;
  }

  return null;
}

export function formatReportProblemProductVersionDisplay(context: ReportProblemContext): string {
  const structuredParts: string[] = [];
  const deployStamp = context.deployStamp?.trim() ?? "";

  if (deployStamp.length > 0) {
    structuredParts.push(`Build ${deployStamp}`);
  }

  const apiCommitSha = context.apiCommitSha?.trim() ?? "";

  if (apiCommitSha.length > 0) {
    structuredParts.push(`API ${formatShortCommitSha(apiCommitSha)}`);
  }

  const uiCommitSha = context.uiCommitSha?.trim() ?? "";

  if (uiCommitSha.length > 0) {
    structuredParts.push(`UI ${formatShortCommitSha(uiCommitSha)}`);
  }

  if (structuredParts.length > 0) {
    return structuredParts.join(" · ");
  }

  const legacyParts: string[] = [];
  const productVersion = context.productVersion?.trim() ?? "";

  if (productVersion.length > 0) {
    legacyParts.push(productVersion);
  }

  const uiVersion = context.uiVersion?.trim() ?? "";

  if (uiVersion.length > 0) {
    legacyParts.push(`UI ${uiVersion}`);
  }

  return legacyParts.length > 0 ? legacyParts.join(" · ") : REPORT_PROBLEM_MISSING_VALUE;
}

function formatOptionalField(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : REPORT_PROBLEM_MISSING_VALUE;
}

function formatReportProblemErrorDisplay(context: ReportProblemContext): string {
  const title = context.errorTitle?.trim() ?? "";
  const code = context.errorCode?.trim() ?? "";

  if (title.length > 0 && code.length > 0) {
    return `${title} (${code})`;
  }

  if (title.length > 0) {
    return title;
  }

  if (code.length > 0) {
    return code;
  }

  return REPORT_PROBLEM_MISSING_VALUE;
}

function hasApiUiCommitMismatch(context: ReportProblemContext): boolean {
  const apiCommitSha = context.apiCommitSha?.trim() ?? "";
  const uiCommitSha = context.uiCommitSha?.trim() ?? "";

  if (apiCommitSha.length === 0 || uiCommitSha.length === 0) {
    return false;
  }

  return apiCommitSha.toLowerCase() !== uiCommitSha.toLowerCase();
}

function ReportProblemContextSummary(props: { readonly context: ReportProblemContext }): React.JSX.Element {
  const { context } = props;
  const referenceId = resolveReportProblemReferenceId(context);
  const showMismatchHint = hasApiUiCommitMismatch(context);

  return (
    <div
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="report-problem-context-summary"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        {REPORT_PROBLEM_SUMMARY_TITLE}
      </p>
      <dl className="m-0 space-y-2">
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REPORT_PROBLEM_FIELD_LABEL_REVIEW_ID}
          </dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatOptionalField(context.reviewId)}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REPORT_PROBLEM_FIELD_LABEL_WORKSPACE}
          </dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatOptionalField(context.workspaceId)}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REPORT_PROBLEM_FIELD_LABEL_REFERENCE_ID}
          </dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatOptionalField(referenceId)}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REPORT_PROBLEM_FIELD_LABEL_PRODUCT_VERSION}
          </dt>
          <dd
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="report-problem-product-version"
          >
            {formatReportProblemProductVersionDisplay(context)}
          </dd>
        </div>
      </dl>
      {showMismatchHint ? (
        <p
          className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="report-problem-api-ui-mismatch"
          role="status"
        >
          {REPORT_PROBLEM_API_UI_MISMATCH_HINT}
        </p>
      ) : null}
      <details className="rounded-md border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
        <summary
          className={cn("cursor-pointer font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="report-problem-details-summary"
        >
          {REPORT_PROBLEM_DETAILS_SUMMARY_LABEL}
        </summary>
        <dl className="m-0 mt-2 space-y-2">
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_ROUTE}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.routePath)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_ERROR}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatReportProblemErrorDisplay(context)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_BROWSER}
            </dt>
            <dd className={cn("m-0 break-all text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.browserClient)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_DEPLOY_STAMP}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.deployStamp)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_API_COMMIT}
            </dt>
            <dd className={cn("m-0 break-all text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.apiCommitSha)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_UI_COMMIT}
            </dt>
            <dd className={cn("m-0 break-all text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.uiCommitSha)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_ENVIRONMENT}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.environment)}
            </dd>
          </div>
        </dl>
      </details>
    </div>
  );
}

function ReportProblemAcknowledgementPanel(props: {
  readonly referenceId: string;
  readonly supportBundleAttachWarning: string | null;
}): React.JSX.Element {
  const { referenceId, supportBundleAttachWarning } = props;
  const acknowledgement = formatReportProblemAcknowledgement(referenceId);

  return (
    <div className="space-y-4" data-testid="report-problem-ack-panel">
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{acknowledgement}</p>
      {supportBundleAttachWarning !== null ? (
        <p
          className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="report-problem-bundle-attach-warning"
          role="status"
        >
          {supportBundleAttachWarning}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <span className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {REPORT_PROBLEM_FIELD_LABEL_REFERENCE_ID}
        </span>
        <code className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{referenceId}</code>
        <CopyIdButton value={referenceId} aria-label="Copy report reference ID" />
      </div>
    </div>
  );
}

/** Reusable Report Problem dialog — prefilled context, consent gate, submit + ack (TB-784). */
export function ReportProblemDialog({
  open,
  onOpenChange,
  context,
  onSubmit,
}: ReportProblemDialogProps): React.JSX.Element {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        role="dialog"
        aria-labelledby="report-problem-dialog-title"
        {...(phase === "form" ? { "aria-describedby": "report-problem-dialog-description" } : {})}
        data-testid="report-problem-dialog"
      >
        <DialogHeader>
          <DialogTitle id="report-problem-dialog-title">
            {phase === "acknowledged" ? REPORT_PROBLEM_ACK_HEADING : REPORT_PROBLEM_DIALOG_TITLE}
          </DialogTitle>
          {phase === "form" ? (
            <DialogDescription id="report-problem-dialog-description">
              {REPORT_PROBLEM_DIALOG_DESCRIPTION}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <ReportProblemDialogHelpHubVocabularyRail currentSurfaceId="report-problem-dialog" />

        {phase === "acknowledged" && referenceId !== null ? (
          <ReportProblemAcknowledgementPanel
            referenceId={referenceId}
            supportBundleAttachWarning={supportBundleAttachWarning}
          />
        ) : (
          <div className="space-y-4">
            <ReportProblemContextSummary context={context} />

            <div className="space-y-2">
              <Label htmlFor="report-problem-operator-note" className={OPERATOR_TYPOGRAPHY.body}>
                {REPORT_PROBLEM_NOTE_LABEL}
              </Label>
              <Textarea
                id="report-problem-operator-note"
                value={operatorNote}
                maxLength={REPORT_PROBLEM_OPERATOR_NOTE_MAX_LENGTH}
                placeholder={REPORT_PROBLEM_NOTE_PLACEHOLDER}
                rows={4}
                data-testid="report-problem-operator-note"
                onChange={(event) => {
                  setOperatorNote(event.target.value);
                }}
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="report-problem-consent"
                checked={consentGranted}
                data-testid="report-problem-consent"
                onCheckedChange={(checked) => {
                  setConsentGranted(checked === true);
                }}
              />
              <Label htmlFor="report-problem-consent" className={OPERATOR_TYPOGRAPHY.body}>
                {REPORT_PROBLEM_CONSENT_LABEL}
              </Label>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="report-problem-attach-bundle"
                checked={attachSupportBundle}
                disabled={!consentGranted || submitting}
                aria-describedby="report-problem-attach-bundle-hint"
                data-testid="report-problem-attach-bundle"
                onCheckedChange={(checked) => {
                  setAttachSupportBundle(checked === true);
                }}
              />
              <div className="space-y-1">
                <Label htmlFor="report-problem-attach-bundle" className={OPERATOR_TYPOGRAPHY.body}>
                  {REPORT_PROBLEM_ATTACH_BUNDLE_LABEL}
                </Label>
                <p
                  id="report-problem-attach-bundle-hint"
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                >
                  {REPORT_PROBLEM_ATTACH_BUNDLE_HINT}{" "}
                  <Link
                    href={REPORT_PROBLEM_ATTACH_BUNDLE_HELP_HREF}
                    className="font-medium text-teal-800 underline dark:text-teal-300"
                  >
                    {REPORT_PROBLEM_ATTACH_BUNDLE_HELP_LINK_LABEL}
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {phase === "acknowledged" ? (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                {REPORT_PROBLEM_CANCEL_LABEL}
              </Button>
              <Button
                type="button"
                disabled={submitDisabled}
                data-testid="report-problem-submit"
                onClick={() => {
                  void handleSubmit();
                }}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    Submitting…
                  </span>
                ) : (
                  REPORT_PROBLEM_SUBMIT_LABEL
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
