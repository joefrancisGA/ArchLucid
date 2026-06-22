import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { BUYER_GET_STARTED_VERTICAL_SLUGS, VERTICAL_DISPLAY_NAMES } from "./get-started-verticals";
import { BUYER_OUTCOME_LED_VALUE_PROPOSITION } from "@/lib/buyer-polish-copy";
import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

export const metadata: Metadata = {
  title: "Get started · ArchLucid",
  description: `Sign in, pick a vertical, start a sample review, read your first finding — the first thirty minutes with ArchLucid (${BRAND_CATEGORY}), hosted, no install.`,
  robots: { index: true, follow: true },
  other: {
    "x-archlucid-brand-category-legacy": BRAND_CATEGORY_LEGACY,
  },
};

type Step = {
  readonly n: number;
  readonly title: string;
  readonly body: string;
};

const STEPS: readonly Step[] = [
  {
    n: 1,
    title: "Sign in",
    body: "Open archlucid.net and sign in with your work identity (Microsoft Entra ID or a Google Workspace account). The sign-in flow uses your existing identity provider — there is no separate account to create and no credit card is required to start. You will land on a clean workspace ready for your first architecture review.",
  },
  {
    n: 2,
    title: "Pick a vertical",
    body: "A short picker asks which industry profile to start from. The defaults match the briefs in templates/briefs/ — financial-services, healthcare, public-sector, public-sector-us, retail, saas. Choose the closest match; you can change it later. The vertical sets default compliance rules, terminology, and analysis priorities so the first review produces findings relevant to your domain. You are not locked in — the vertical can be changed at any time, and you can run reviews against multiple verticals from the same workspace.",
  },
  {
    n: 3,
    title: "Start a sample review & read your first finding",
    body: "ArchLucid pre-populates a sample architecture request shaped for the vertical you picked, then runs the analysis pipeline — no upload required for the first pass. Within a few seconds you get a signed review record with structured findings. Open the review and read your first typed finding — what was flagged, why it was flagged, what evidence backs it — the smallest unit of value the product produces.",
  },
  {
    n: 4,
    title: "Decide what to do next",
    body: "Either invite a colleague and start a second sample review, or hand off to a guided evaluation. Invite a colleague to sign in and repeat the same sample or a different vertical — no configuration is needed. When you are ready for real inputs, the guided evaluation path walks through finalizing a signed review record and reviewing artifacts you would ship in production.",
  },
] as const;

/** When set at build time, marketing shows a CTA to the public demo (e.g. https://demo.archlucid.net). */
function getLiveDemoUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_DEMO_URL?.trim();
  if (!raw) {
    return null;
  }
  if (!/^https:\/\//i.test(raw) || raw.includes("..")) {
    return null;
  }
  return raw;
}

export default function GetStartedPage(): ReactNode {
  const liveDemoUrl = getLiveDemoUrl();
  return (
    <MarketingPageShell variant="reading">
      <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>Your first 30 minutes with ArchLucid</h1>
      <p
        className={`mt-2 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}
        data-testid="get-started-brand-category-paragraph"
      >
        ArchLucid is an {BRAND_CATEGORY} product — this page walks through signup, vertical selection, and your first
        sample review.
      </p>
      <p
        className={`mt-2 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}
        data-testid="get-started-outcome-led-lead"
      >
        {BUYER_OUTCOME_LED_VALUE_PROPOSITION}
      </p>
      <p className={`mt-2 ${MARKETING_TYPOGRAPHY.meta}`}>
        ArchLucid is a SaaS product. Nothing on this page asks you to install Docker, SQL Server, .NET, Node, Terraform,
        or a CLI.
      </p>
      <p className={`mt-2 ${MARKETING_TYPOGRAPHY.meta}`}>
        Four milestones. Roughly thirty minutes end-to-end on a normal connection.
      </p>
      <p className={`mt-2 ${MARKETING_TYPOGRAPHY.meta}`}>
        Want proof without signing in first?{" "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/demo/preview">
          See the evidence trail walkthrough
        </Link>{" "}
        (same seeded demo surface as{" "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/demo/preview">
          the demo preview page
        </Link>
        , interactive explainability view).{" "}
        <span className="font-medium text-al-text-primary">Verify:</span>{" "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/see-it">
          See it in 30 seconds
        </Link>
        ,{" "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/why">
          Why ArchLucid
        </Link>
        .
      </p>

      {liveDemoUrl ? (
        <div className={`${MARKETING_SURFACES.mutedPanel} mt-6`} data-testid="get-started-live-demo-cta">
          <p className={`${MARKETING_TYPOGRAPHY.sectionTitle} m-0`}>Try the live demo</p>
          <p className={`mt-1 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
            Open the shared sandbox (ArchLucid in simulator mode — no install). You can review pre-seeded sample runs
            and start your own.
          </p>
          <p className="mt-3">
            <a
              className={MARKETING_SURFACES.inlineLink}
              data-testid="get-started-live-demo-link"
              href={liveDemoUrl}
              rel="noopener noreferrer"
            >
              Open demo environment
            </a>
          </p>
        </div>
      ) : null}

      <section aria-labelledby="vertical-picker-heading" className="mt-8" data-testid="get-started-vertical-picker">
        <h2 id="vertical-picker-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
          Pick a vertical to start
        </h2>
        <p className={`mt-1 ${MARKETING_TYPOGRAPHY.meta}`}>
          Defaults mirror the existing briefs in templates/briefs/.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="list">
          {BUYER_GET_STARTED_VERTICAL_SLUGS.map((slug) => (
            <li key={slug}>
              <button
                type="button"
                data-testid={`get-started-vertical-${slug}`}
                data-vertical-slug={slug}
                className={`w-full ${MARKETING_SURFACES.card} text-left hover:border-[var(--al-accent-interactive)]`}
              >
                {VERTICAL_DISPLAY_NAMES[slug]}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ol className="mt-10 space-y-8" data-testid="get-started-steps">
        {STEPS.map((step) => (
          <li key={step.n} data-testid={`get-started-step-${step.n}`} className="flex gap-4">
            <div className={MARKETING_SURFACES.stepIndicator} data-testid={`get-started-step-${step.n}-indicator`} aria-hidden="true">
              {step.n}
            </div>
            <div>
              <h3 className={MARKETING_TYPOGRAPHY.sectionTitle}>{step.title}</h3>
              <p className={`mt-1 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section aria-labelledby="next-heading" className="mt-12 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 id="next-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
          Where to go next
        </h2>
        <ul className={`mt-3 list-disc space-y-1 pl-5 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
          <li>
            Ready for an evaluation with your own data? The{" "}
            <Link className={MARKETING_SURFACES.inlineLink} href={resolveInAppDocHref("docs/CORE_PILOT.md")}>
              Core evaluation guide
            </Link>{" "}
            walks through creating a request, finalizing a signed review record, and reviewing real artifacts.
          </li>
          <li>
            For the operator path after the sample run, see{" "}
            <Link className={MARKETING_SURFACES.inlineLink} href="/pricing">
              pricing
            </Link>{" "}
            or request a quote from the pricing page.
          </li>
          <li>
            For the sponsor-facing narrative, see the{" "}
            <Link className={MARKETING_SURFACES.inlineLink} href={resolveInAppDocHref("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md")}>
              executive sponsor brief
            </Link>
            .
          </li>
        </ul>
      </section>
    </MarketingPageShell>
  );
}
