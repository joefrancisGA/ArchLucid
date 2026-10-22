import Link from "next/link";

import { SeeItDeliverablePreview } from "@/app/(marketing)/see-it/SeeItDeliverablePreview";
import { SignupBreadcrumb } from "@/components/marketing/signup/SignupBreadcrumb";
import { SignupEvidenceOrientationStrip } from "@/components/marketing/SignupEvidenceOrientationStrip";
import { CUSTOMER_AUTH_EVALUATION_SIGNUP_LEAD } from "@/lib/auth/customer-auth-messaging";
import { MARKETING_LAYOUT, MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNUP_PAGE_TITLE } from "@/lib/marketing/signup-page-copy";
import { SIGNUP_PAGE_INVITE_ONLY_LEAD } from "@/lib/signup-invite-only-copy";
import { cn } from "@/lib/utils";

type SignupHeroSectionProps = {
  readonly publicSignupEnabled: boolean;
};

/** `/signup` hero — breadcrumb, evaluation lead, sample preview, and claim orientation. */
export function SignupHeroSection(props: SignupHeroSectionProps): React.JSX.Element {
  const { publicSignupEnabled } = props;

  return (
    <section
      className={cn(
        "grid items-start gap-10 border-b border-neutral-200 pb-8 dark:border-neutral-800 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10",
        MARKETING_MOTION.revealIn,
      )}
      data-testid="signup-hero"
      aria-labelledby="signup-hero-heading"
    >
      <header className="text-left">
        <div className="mb-3">
          <SignupBreadcrumb />
        </div>
        <h1 id="signup-hero-heading" className={MARKETING_TYPOGRAPHY.heroTitle}>
          {SIGNUP_PAGE_TITLE}
        </h1>
        <p className={cn("mt-3 max-w-2xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          {publicSignupEnabled
            ? `${CUSTOMER_AUTH_EVALUATION_SIGNUP_LEAD} No sales call required.`
            : SIGNUP_PAGE_INVITE_ONLY_LEAD}
        </p>
        <p className={cn("mt-4 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          Already have an account?{" "}
          <Link href="/auth/signin" className={MARKETING_SURFACES.inlineLink}>
            Sign in
          </Link>
        </p>
      </header>

      <div className={cn("space-y-4", MARKETING_LAYOUT.sectionStack)}>
        <div data-testid="signup-orientation-top">
          <SignupEvidenceOrientationStrip part="claim" />
        </div>
        <SeeItDeliverablePreview />
      </div>
    </section>
  );
}
