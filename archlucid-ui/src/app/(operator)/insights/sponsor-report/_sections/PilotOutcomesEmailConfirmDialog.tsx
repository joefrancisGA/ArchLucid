"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PilotOutcomesEmailPreview } from "./pilot-value-report-pilot-page-view-model";

type Props = {
  readonly open: boolean;
  readonly preview: PilotOutcomesEmailPreview | null;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
};

export function PilotOutcomesEmailConfirmDialog(props: Props) {
  if (!props.open || props.preview === null) {
    return null;
  }

  const preview = props.preview;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      data-testid="pilot-outcomes-email-dialog"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pilot-outcomes-email-dialog-title"
        className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
      >
        <h2 id="pilot-outcomes-email-dialog-title" className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>
          Send sponsor briefing
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Review what will be included before opening your email client.
        </p>

        <dl className={cn("mt-4 space-y-2", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className="text-al-text-secondary">Recipient</dt>
            <dd className="m-0">{preview.recipient}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Reporting period</dt>
            <dd className="m-0">{preview.reportingPeriodLabel}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Included sections</dt>
            <dd className="m-0">
              <ul className="m-0 list-disc pl-5">
                {preview.includedSections.map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Format</dt>
            <dd className="m-0">{preview.attachmentFormat}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Based on current saved data</dt>
            <dd className="m-0">{preview.basedOnCurrentData ? "Yes" : "No — period has no finalized reviews"}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={props.onClose} disabled={props.busy}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={() => void props.onConfirm()} disabled={props.busy}>
            {props.busy ? "Sending sponsor report…" : "Open email to send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
