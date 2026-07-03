import Link from "next/link";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

/** Server-rendered first-time visitor path for `/welcome` (TB-566). */
export function WelcomeMarketingFirstTimeVisitorSection(): React.JSX.Element {
  return (
    <section aria-labelledby="walkthrough-heading" className={`mb-14 ${MARKETING_SURFACES.sectionPanel}`}>
      <h2 id="walkthrough-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
        First-time visitor path
      </h2>
      <p className={`mt-2 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
        Hosted SaaS evaluation workspace: create an architecture review request, let the pipeline finish, finalize when ready,
        then open your review package — no local Docker required for the buyer story.
      </p>
      <ol className={`mt-4 list-decimal space-y-2 pl-5 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
        <li>
          <Link className={MARKETING_SURFACES.inlineLink} href="/see-it">
            See it (30s)
          </Link>{" "}
          — fastest visual proof; then{" "}
          <Link className={MARKETING_SURFACES.inlineLink} href="/why">
            Why ArchLucid
          </Link>{" "}
          for positioning depth.
        </li>
        <li>
          <Link className={MARKETING_SURFACES.inlineLink} href="/compliance-journey">
            Compliance journey
          </Link>{" "}
          — how reviewers map controls to shipped mechanisms.
        </li>
        <li>
          <Link className={MARKETING_SURFACES.inlineLink} href="/trust">
            Trust Center
          </Link>
          , privacy, and procurement-linked evidence.
        </li>
      </ol>
    </section>
  );
}
