"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  MarketingEarlyAccessForm,
  MarketingEarlyAccessThanks,
} from "@/components/marketing/MarketingEarlyAccessForm";
import { useMarketingEarlyAccessSubmit } from "@/hooks/use-marketing-early-access-submit";

const THANKS_COPY = "Thanks! Our team will follow up within 2 business days.";

export type HeroEarlyAccessCtaProps = {
  /** Clarity dimension {@code cta_source} (default {@code hero}). */
  readonly source?: string;
  readonly className?: string;
  /** When true, show the form immediately (invite-only `/signup`). */
  readonly defaultOpen?: boolean;
  readonly intro?: string;
  readonly submitLabel?: string;
  readonly thanksCopy?: string;
  readonly openButtonLabel?: string;
};

/**
 * Tertiary hero capture — not tenant signup; no instant product access messaging.
 */
export function HeroEarlyAccessCta(props: HeroEarlyAccessCtaProps) {
  const source = props.source ?? "hero";
  const className = props.className;
  const defaultOpen = props.defaultOpen === true;
  const intro =
    props.intro ??
    "Request a conversatio — his is not instant product access, checkout, or the same as a walkthrough-led pilot.";
  const submitLabel = props.submitLabel ?? "Submit";
  const thanksCopy = props.thanksCopy ?? THANKS_COPY;
  const openButtonLabel = props.openButtonLabel ?? "Join early access";
  const submitState = useMarketingEarlyAccessSubmit({ source });
  const [open, setOpen] = useState(defaultOpen);

  if (submitState.done) {
    return <MarketingEarlyAccessThanks variant="hero" thanksCopy={thanksCopy} className={className} />;
  }

  const canCancel = !defaultOpen;

  return (
    <div className={cn("mx-auto mt-4 flex w-full max-w-md flex-col items-center gap-3", className)}>
      {open ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("font-medium text-teal-800 dark:text-teal-200", OPERATOR_TYPOGRAPHY.body)}
          onClick={() => setOpen(true)}
        >
          {openButtonLabel}
        </Button>
      )}

      {open ? (
        <MarketingEarlyAccessForm
          variant="hero"
          submitState={submitState}
          intro={intro}
          submitLabel={submitLabel}
          showCancel={canCancel}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
