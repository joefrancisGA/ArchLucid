import Link from "next/link";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Server-rendered proof cards for `/welcome` (TB-566). */
export function WelcomeMarketingProofAtGlanceSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="welcome-proof-heading"
      className="mb-12"
      data-testid="welcome-proof-at-a-glance"
    >
      <h2 id="welcome-proof-heading" className={`mb-4 ${MARKETING_TYPOGRAPHY.sectionTitle}`}>
        Proof at a glance
      </h2>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
        <li className={MARKETING_SURFACES.card}>
          <p className={`m-0 ${MARKETING_TYPOGRAPHY.cardTitle}`}>Decision-grade outputs</p>
          <p className={`m-0 mt-2 ${MARKETING_TYPOGRAPHY.meta}`}>
            Structured findings with a versioned review you can hand to ARB and audit partners.
          </p>
          <p className={cn("m-0 mt-3 font-medium", OPERATOR_TYPOGRAPHY.helper)}>
            <Link className={MARKETING_SURFACES.inlineLink} href="/why">
              Why teams standardize on ArchLucid
            </Link>
          </p>
        </li>
        <li className={MARKETING_SURFACES.card}>
          <p className={`m-0 ${MARKETING_TYPOGRAPHY.cardTitle}`}>Evidence you can follow</p>
          <p className={`m-0 mt-2 ${MARKETING_TYPOGRAPHY.meta}`}>
            Trace graph tie-outs and audit milestones—not an ephemeral chat transcript.
          </p>
          <p className={cn("m-0 mt-3 font-medium", OPERATOR_TYPOGRAPHY.helper)}>
            <Link className={MARKETING_SURFACES.inlineLink} href="/see-it">
              See it in 30 seconds
            </Link>
          </p>
        </li>
        <li className={MARKETING_SURFACES.card}>
          <p className={`m-0 ${MARKETING_TYPOGRAPHY.cardTitle}`}>Procurement-ready posture</p>
          <p className={`m-0 mt-2 ${MARKETING_TYPOGRAPHY.meta}`}>
            Published Trust Center materials and downloadable diligence anchors—know what to verify.
          </p>
          <p className={cn("m-0 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium", OPERATOR_TYPOGRAPHY.helper)}>
            <Link className={MARKETING_SURFACES.inlineLink} href="/trust">
              Open Trust Center
            </Link>
            <Link className={MARKETING_SURFACES.inlineLink} href="/security-trust">
              Security and trust detail
            </Link>
          </p>
        </li>
      </ul>
    </section>
  );
}
