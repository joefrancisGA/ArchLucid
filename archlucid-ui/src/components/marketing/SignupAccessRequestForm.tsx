"use client";

import {
  MarketingEarlyAccessForm,
  MarketingEarlyAccessThanks,
} from "@/components/marketing/MarketingEarlyAccessForm";
import { useMarketingEarlyAccessSubmit } from "@/hooks/use-marketing-early-access-submit";
import {
  SIGNUP_INVITE_ONLY_FORM_INTRO,
  SIGNUP_INVITE_ONLY_SUBMIT_LABEL,
  SIGNUP_INVITE_ONLY_THANKS,
} from "@/lib/signup-invite-only-copy";

/**
 * Invite-only `/signup` capture — fields always visible (no click-to-reveal gate).
 * Reuses marketing early-access API; Clarity source = signup.
 */
export function SignupAccessRequestForm(): React.JSX.Element {
  const submitState = useMarketingEarlyAccessSubmit({ source: "signup" });

  if (submitState.done) {
    return <MarketingEarlyAccessThanks variant="signup" thanksCopy={SIGNUP_INVITE_ONLY_THANKS} />;
  }

  return (
    <MarketingEarlyAccessForm
      variant="signup"
      submitState={submitState}
      intro={SIGNUP_INVITE_ONLY_FORM_INTRO}
      submitLabel={SIGNUP_INVITE_ONLY_SUBMIT_LABEL}
    />
  );
}
