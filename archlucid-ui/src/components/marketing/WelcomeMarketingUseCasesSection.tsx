import Link from "next/link";

import {
  WELCOME_POLICY_PACK_DISCLAIMER,
  WELCOME_USE_CASE_CARDS,
} from "@/components/marketing/welcome-marketing-copy";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

/** Bundled policy-pack use cases for Azure-first buyers (with framework disclaimer). */
export function WelcomeMarketingUseCasesSection() {
  return (
    <section
      aria-labelledby="welcome-use-cases-heading"
      className="mb-12"
      data-testid="welcome-use-cases"
    >
      <h2 id="welcome-use-cases-heading" className="text-xl font-semibold tracking-tight text-al-text-primary">
        Use cases — bundled policy packs
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        Every net-new tenant ships curated governance packs — including Azure WAF and CAF/landing-zone themes — so
        pilots start with review-ready rules instead of an empty library.
      </p>
      <ul className="mt-6 grid list-none gap-4 p-0 md:grid-cols-3">
        {WELCOME_USE_CASE_CARDS.map((useCase) => (
          <li
            key={useCase.id}
            className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            data-testid={`welcome-use-case-${useCase.id}`}
          >
            <h3 className="text-sm font-semibold text-al-text-primary">{useCase.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{useCase.body}</p>
          </li>
        ))}
      </ul>
      <p
        className="mt-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400"
        data-testid="welcome-policy-pack-disclaimer"
      >
        {WELCOME_POLICY_PACK_DISCLAIMER}{" "}
        <Link
          className="text-teal-700 underline underline-offset-2 dark:text-teal-300"
          href={resolveInAppDocHref("docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md")}
        >
          Default policy packs (V1)
        </Link>
        .
      </p>
    </section>
  );
}
