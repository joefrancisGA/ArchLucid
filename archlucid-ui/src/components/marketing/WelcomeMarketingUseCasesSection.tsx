import { cn } from "@/lib/utils";
import { MARKETING_LAYOUT, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import {
  WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE,
  WELCOME_POLICY_PACK_DISCLAIMER,
  WELCOME_USE_CASE_CARDS,
} from "@/components/marketing/welcome-marketing-copy";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

/** Bundled policy-pack use cases across cloud frameworks (with thematic-mapping disclaimer). */
export function WelcomeMarketingUseCasesSection() {
  return (
    <section
      aria-labelledby="welcome-use-cases-heading"
      className={MARKETING_LAYOUT.sectionStack}
      data-testid="welcome-use-cases"
    >
      <h2 id="welcome-use-cases-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
        Use cases — bundled policy packs
      </h2>
      <p className={cn("mt-3 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.lead)}>
        Every net-new tenant ships curated governance packs, including AWS, Azure, and Google Cloud framework themes.
      </p>
      <ul className="mt-6 grid list-none gap-4 p-0 md:grid-cols-3">
        {WELCOME_USE_CASE_CARDS.map((useCase) => (
          <li
            key={useCase.id}
            className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            data-testid={`welcome-use-case-${useCase.id}`}
          >
            <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>{useCase.title}</h3>
            <p className={cn("mt-2 leading-relaxed text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{useCase.body}</p>
            <p className="mt-3">
              <Link
                className={MARKETING_SURFACES.inlineLink}
                data-testid={`welcome-use-case-${useCase.id}-cta`}
                href={useCase.href}
              >
                {useCase.ctaLabel}
              </Link>
            </p>
          </li>
        ))}
      </ul>
      <details className="mt-4 max-w-3xl" data-testid="welcome-policy-pack-disclaimer">
        <summary className={cn("cursor-pointer text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          Policy pack mapping and baseline note
        </summary>
        <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          {WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE}{" "}
          {WELCOME_POLICY_PACK_DISCLAIMER}{" "}
          <Link
            className={MARKETING_SURFACES.inlineLink}
            href={resolveInAppDocHref("docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md")}
          >
            Default policy packs
          </Link>
          .
        </p>
      </details>
    </section>
  );
}
