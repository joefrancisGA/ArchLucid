"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";

import { DigestSubscriptionCreateFormFields } from "./DigestSubscriptionCreateFormFields";
import { DigestSubscriptionCreatePreview } from "./DigestSubscriptionCreatePreview";
import {
  useDigestSubscriptionCreateForm,
  type DigestSubscriptionCreateFormProps,
} from "./use-digest-subscription-create-form";

export type { DigestSubscriptionCreateFormProps };

export function DigestSubscriptionCreateForm(props: DigestSubscriptionCreateFormProps): ReactElement {
  const form = useDigestSubscriptionCreateForm(props);

  if (!form.expanded) {
    return (
      <section
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
        data-testid="digest-subscription-create-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Add delivery destination
          </h3>
          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => form.setExpanded(true)}
              disabled={!form.canEdit}
              aria-describedby={form.createDisabledReason === null ? undefined : form.createDisabledHintId}
            >
              {form.canEdit ? "Add delivery destination" : form.digestSubscriptionsCreateSubscriptionButtonLabelReaderRank}
            </Button>
            <WhyDisabledCtaHint
              id={form.createDisabledHintId}
              reason={form.createDisabledReason}
              testId="digest-subscription-create-mutate-disabled-hint"
              className="text-right"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="digest-subscription-create-card"
    >
      <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {form.collapsedByDefault ? "Add delivery destination" : "New delivery destination"}
      </h3>

      <DigestSubscriptionCreateFormFields form={form} />
      <DigestSubscriptionCreatePreview form={form} />
    </section>
  );
}
