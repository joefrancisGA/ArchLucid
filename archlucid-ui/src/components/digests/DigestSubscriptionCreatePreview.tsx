"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement } from "react";

import { DigestPreviewBeforeSubscribePanel } from "@/components/digests/DigestPreviewBeforeSubscribePanel";
import { MutatingInTenantChip } from "@/components/MutatingInTenantChip";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";

import type { DigestSubscriptionCreateFormViewModel } from "./use-digest-subscription-create-form";

export type DigestSubscriptionCreatePreviewProps = {
  readonly form: DigestSubscriptionCreateFormViewModel;
};

export function DigestSubscriptionCreatePreview(props: DigestSubscriptionCreatePreviewProps): ReactElement {
  const { form } = props;

  return (
    <>
      <div className="mt-3 flex flex-col items-start gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={form.handleCreate}
            disabled={!form.formValid || form.creating || !form.canEdit}
            aria-describedby={form.createButtonDescribedBy}
            data-testid="digest-subscription-create-button"
          >
            {form.creating
              ? "Saving…"
              : form.canEdit
                ? "Save delivery destination"
                : form.digestSubscriptionsCreateSubscriptionButtonLabelReaderRank}
          </Button>
          <MutatingInTenantChip />
          {form.createSuccess ? (
            <span
              className={cn("text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="digest-subscription-create-success"
              role="status"
            >
              Delivery destination saved
            </span>
          ) : null}
        </div>
        <WhyDisabledCtaHint
          id={form.createDisabledHintId}
          reason={form.createDisabledReason}
          testId="digest-subscription-create-disabled-hint"
        />
      </div>

      <DigestPreviewBeforeSubscribePanel
        className="mt-3"
        variant="architecture-subscription"
        subscriptionName={form.name}
        channelType={form.channelType}
        destination={form.destination}
        digestTypeLabel={form.digestTypeLabel}
      />
    </>
  );
}
