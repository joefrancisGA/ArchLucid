"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";

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
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReportProblemContext } from "@/lib/report-problem-context";
import {
  REPORT_PROBLEM_ACK_HEADING,
  REPORT_PROBLEM_ATTACH_BUNDLE_HELP_HREF,
  REPORT_PROBLEM_ATTACH_BUNDLE_HELP_LINK_LABEL,
  REPORT_PROBLEM_ATTACH_BUNDLE_HINT,
  REPORT_PROBLEM_ATTACH_BUNDLE_LABEL,
  REPORT_PROBLEM_CANCEL_LABEL,
  REPORT_PROBLEM_CONSENT_LABEL,
  REPORT_PROBLEM_DIALOG_DESCRIPTION,
  REPORT_PROBLEM_DIALOG_TITLE,
  REPORT_PROBLEM_NOTE_LABEL,
  REPORT_PROBLEM_NOTE_PLACEHOLDER,
  REPORT_PROBLEM_OPERATOR_NOTE_MAX_LENGTH,
  REPORT_PROBLEM_SUBMIT_LABEL,
} from "@/lib/report-problem-copy";

import { ReportProblemAcknowledgementPanel } from "./ReportProblemAcknowledgementPanel";
import { ReportProblemContextSummary } from "./ReportProblemContextSummary";
import {
  formatReportProblemProductVersionDisplay,
  resolveReportProblemReferenceId,
} from "./report-problem-formatters";
import {
  useReportProblemDialog,
  type ReportProblemSubmitPayload,
  type ReportProblemSubmitResult,
} from "./use-report-problem-dialog";

export type { ReportProblemSubmitPayload, ReportProblemSubmitResult };

export type ReportProblemDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly context: ReportProblemContext;
  readonly onSubmit: (payload: ReportProblemSubmitPayload) => Promise<ReportProblemSubmitResult>;
};

export {
  formatReportProblemProductVersionDisplay,
  resolveReportProblemReferenceId,
} from "./report-problem-formatters";

/** Reusable Report Problem dialog — prefilled context, consent gate, submit + ack (TB-784). */
export function ReportProblemDialog({
  open,
  onOpenChange,
  context,
  onSubmit,
}: ReportProblemDialogProps): React.JSX.Element {
  const dialog = useReportProblemDialog({ open, context, onSubmit });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        role="dialog"
        aria-labelledby="report-problem-dialog-title"
        {...(dialog.phase === "form" ? { "aria-describedby": "report-problem-dialog-description" } : {})}
        data-testid="report-problem-dialog"
      >
        <DialogHeader>
          <DialogTitle id="report-problem-dialog-title">
            {dialog.phase === "acknowledged" ? REPORT_PROBLEM_ACK_HEADING : REPORT_PROBLEM_DIALOG_TITLE}
          </DialogTitle>
          {dialog.phase === "form" ? (
            <DialogDescription id="report-problem-dialog-description">
              {REPORT_PROBLEM_DIALOG_DESCRIPTION}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <ReportProblemDialogHelpHubVocabularyRail currentSurfaceId="report-problem-dialog" />

        {dialog.phase === "acknowledged" && dialog.referenceId !== null ? (
          <ReportProblemAcknowledgementPanel
            referenceId={dialog.referenceId}
            supportBundleAttachWarning={dialog.supportBundleAttachWarning}
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
                value={dialog.operatorNote}
                maxLength={REPORT_PROBLEM_OPERATOR_NOTE_MAX_LENGTH}
                placeholder={REPORT_PROBLEM_NOTE_PLACEHOLDER}
                rows={4}
                data-testid="report-problem-operator-note"
                onChange={(event) => {
                  dialog.setOperatorNote(event.target.value);
                }}
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="report-problem-consent"
                checked={dialog.consentGranted}
                data-testid="report-problem-consent"
                onCheckedChange={(checked) => {
                  dialog.setConsentGranted(checked === true);
                }}
              />
              <Label htmlFor="report-problem-consent" className={OPERATOR_TYPOGRAPHY.body}>
                {REPORT_PROBLEM_CONSENT_LABEL}
              </Label>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="report-problem-attach-bundle"
                checked={dialog.attachSupportBundle}
                disabled={!dialog.consentGranted || dialog.submitting}
                aria-describedby="report-problem-attach-bundle-hint"
                data-testid="report-problem-attach-bundle"
                onCheckedChange={(checked) => {
                  dialog.setAttachSupportBundle(checked === true);
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
                    className={OPERATOR_BODY_INLINE_LINK_CLASS}
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
          {dialog.phase === "acknowledged" ? (
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
                disabled={dialog.submitting}
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                {REPORT_PROBLEM_CANCEL_LABEL}
              </Button>
              <Button
                type="button"
                disabled={dialog.submitDisabled}
                data-testid="report-problem-submit"
                onClick={() => {
                  void dialog.handleSubmit();
                }}
              >
                {dialog.submitting ? (
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
