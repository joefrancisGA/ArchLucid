import Link from "next/link";

import {
  WELCOME_SEE_IT_CTA_LABEL,
  WELCOME_SEE_IT_HREF,
} from "@/components/marketing/welcome-marketing-copy";
import { MARKETING_LAYOUT, MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Server-rendered proof cards and first-time visitor path for `/welcome` (TB-566). */
export function WelcomeMarketingProofAtGlanceSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="welcome-proof-heading"
      className={cn(MARKETING_LAYOUT.sectionStack, MARKETING_MOTION.revealIn)}
      data-testid="welcome-proof-at-a-glance"
    >
      <h2 id="welcome-proof-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
        Proof at a glance
      </h2>
      <p className={cn("mt-3 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.lead)}>
        Inspect governed outputs before you bring your own architecture evidence.
      </p>
      <ul className="m-0 mt-8 grid list-none gap-4 p-0 lg:grid-cols-3">
        <li className={cn(MARKETING_SURFACES.cardComfort, "lg:col-span-1")}>
          <p className={cn("m-0", MARKETING_TYPOGRAPHY.cardTitle)}>Decision-grade outputs</p>
          <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Structured findings with a versioned review you can hand to ARB and audit partners.
          </p>
          <p className={cn("m-0 mt-4 font-medium", MARKETING_TYPOGRAPHY.meta)}>
            <Link className={MARKETING_SURFACES.inlineLink} href="/why">
              Why teams standardize on ArchLucid
            </Link>
          </p>
        </li>
        <li className={cn(MARKETING_SURFACES.cardComfort, "ring-1 ring-teal-800/15 dark:ring-teal-500/20 lg:col-span-1")}>
          <p className={cn("m-0", MARKETING_TYPOGRAPHY.cardTitle)}>Evidence you can follow</p>
          <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Trace graph tie-outs and audit milestones—not an ephemeral chat transcript.
          </p>
          <p className={cn("m-0 mt-4 font-medium", MARKETING_TYPOGRAPHY.meta)}>
            <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_SEE_IT_HREF}>
              {WELCOME_SEE_IT_CTA_LABEL}
            </Link>
          </p>
        </li>
        <li className={cn(MARKETING_SURFACES.cardComfort, "lg:col-span-1")}>
          <p className={cn("m-0", MARKETING_TYPOGRAPHY.cardTitle)}>Procurement-ready posture</p>
          <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Published Trust Center materials and downloadable diligence anchors.
          </p>
          <p className={cn("m-0 mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium", MARKETING_TYPOGRAPHY.meta)}>
            <Link className={MARKETING_SURFACES.inlineLink} href="/trust">
              Open Trust Center
            </Link>
            <Link className={MARKETING_SURFACES.inlineLink} href="/assurance-status">
              Assurance status
            </Link>
          </p>
        </li>
      </ul>

      <div
        className={cn(MARKETING_SURFACES.sectionPanel, "mt-8")}
        data-testid="welcome-first-time-visitor-path"
        aria-labelledby="walkthrough-heading"
      >
        <h3 id="walkthrough-heading" className={MARKETING_TYPOGRAPHY.cardTitle}>
          First-time visitor path
        </h3>
        <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          Create an architecture review request, let the pipeline finish, finalize when ready, then open your review — hosted
          SaaS, no local Docker required.
        </p>
        <ol className={cn("mt-4 list-decimal space-y-2 pl-5 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          <li>
            <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_SEE_IT_HREF}>
              {WELCOME_SEE_IT_CTA_LABEL}
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
      </div>
    </section>
  );
}
