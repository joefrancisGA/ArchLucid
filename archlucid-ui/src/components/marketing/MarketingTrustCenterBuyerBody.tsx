import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/** Curated buyer Trust Center sections — avoids rendering raw repo markdown publicly. */
export type MarketingTrustCenterBuyerBodyProps = {
  readonly lastReviewedUtc: string | null;
};

/** Public Trust Center structured layout (marketing route). Does not imply SOC&nbsp;2 CPA attestation or completed third-party penetration tests unless a published summary states otherwise. */
export function MarketingTrustCenterBuyerBody(props: MarketingTrustCenterBuyerBodyProps): ReactNode {
  const { lastReviewedUtc } = props;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Trust Center</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-900 dark:text-neutral-100">
          Buyers can rely on published procurement artifacts today: control mapping and questionnaire-oriented summaries,
          architecture and security documentation, and audit-ready evidence packages backed by immutable lifecycle logging for
          material changes.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Detailed diligence materials (questionnaire responses, subprocessors, tenancy detail) are delivered through your
          procurement channel — coordinate intake via{" "}
          <Link
            href="#trust-contact-review"
            className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300"
          >
            Security review contact
          </Link>
          .
        </p>

        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          {lastReviewedUtc !== null
            ? `Last assurance content review (UTC): ${lastReviewedUtc}.`
            : "Last assurance content review is refreshed with each assurance-cycle update."}
        </p>

        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 mt-6 px-4 py-4">
          <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Assurance at a glance</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border-2 border-blue-300/80 bg-white/90 p-4 shadow-sm dark:border-blue-800/70 dark:bg-neutral-950/50">
              <p className="m-0 text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-200">
                Available now
              </p>
              <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                <li>
                  Procurement-ready architecture, operations, and security documentation packs you can submit during initial
                  procurement review.
                </li>
                <li>
                  Audit-ready evidence packages and questionnaire-oriented summaries, with immutable lifecycle logging for
                  material changes.
                </li>
                <li>Published procurement artifacts mapped to common security-questionnaire structures.</li>
              </ul>
            </div>
            <div className="rounded-md border border-blue-200/70 bg-white/80 p-3 dark:border-blue-900/60 dark:bg-neutral-950/40">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Shared during diligence
              </p>
              <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                <li>CAIQ-lite / SIG–oriented summaries and questionnaire responses under confidentiality</li>
                <li>
                  Subprocessors and tenancy overview on request — start with{" "}
                  <Link
                    href="#trust-contact-review"
                    className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300"
                  >
                    Security review contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className="rounded-md border border-blue-200/70 bg-white/80 p-3 dark:border-blue-900/60 dark:bg-neutral-950/40">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Planned assurance activities
              </p>
              <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                <li>
                  Formal reports are distributed after completion, approval, and controlled release — aligned with your
                  procurement calendar.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className="mt-6 flex flex-wrap items-center gap-3"
          data-testid="trust-center-primary-ctas"
          aria-label="Trust Center primary actions"
        >
          <Button variant="primary" size="sm" asChild>
            <Link href="mailto:security@archlucid.net">Request diligence materials</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/security-trust">Security and trust detail</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/privacy">Privacy disclosures</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="#trust-contact-review">Security review contact</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section
          aria-labelledby="trust-security-posture"
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40"
        >
          <h2 id="trust-security-posture" className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Security posture summary
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            ArchLucid is built for regulated buyers: tenant isolation, scope-filtered APIs, immutable audit instrumentation for
            material changes, and evidence packs suitable for questionnaires. Detailed control narratives and questionnaire
            responses are shared during diligence.
          </p>
        </section>

        <section
          aria-labelledby="trust-assurance-artifacts"
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40"
        >
          <h2 id="trust-assurance-artifacts" className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Assurance artifacts
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Request the current procurement-ready bundle containing questionnaire pre-fills (for example CAIQ-lite and SIG
            oriented summaries), tenancy and subprocessors overview, SLA summary excerpts, incident response placeholders, and
            security contact references. Detailed reports referenced in questionnaires are commonly shared under confidentiality.
          </p>
        </section>

        <section
          aria-labelledby="trust-data-handling"
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40"
        >
          <h2 id="trust-data-handling" className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Data handling &amp; privacy
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            ArchLucid stores architecture review evidence and governance metadata about systems customers describe — not a clinical
            record system or patient-care record store.{" "}
            The public demo uses illustrative data only and is not intended for regulated health data. Production deployments are
            configured under contractual data-processing terms. Coordinate via the{" "}
            <Link
              href="#trust-contact-review"
              className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300"
            >
              Security review contact
            </Link>{" "}
            for privacy agreements. Plain-language disclosures live on the{" "}
            <Link href="/privacy" className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300">
              Privacy
            </Link>{" "}
            page.
          </p>
        </section>

        <section
          aria-labelledby="trust-procurement"
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40"
        >
          <h2 id="trust-procurement" className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Procurement questionnaire response package
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Procurement teams reuse structured answers mapped to ArchLucid&rsquo;s reusable procurement evidence catalogue. Submit
            your intake form requirements and stakeholder list via the{" "}
            <Link
              href="#trust-contact-review"
              className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300"
            >
              Security review contact
            </Link>{" "}
            so we align the diligence package to your process.
          </p>
        </section>
      </div>

      <section aria-labelledby="trust-planned-assurance">
        <h2 id="trust-planned-assurance" className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Planned assurance
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Planned assurance activities below — timelines align with your procurement calendar.
        </p>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
          <li>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">SOC&nbsp;2 program:</span> readiness mapping
            and control baselines continue on a published cadence. Planned attestations and third-party reports are
            distributed only after completion, approval, and release through the appropriate procurement channel.
          </li>
          <li>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">Penetration testing:</span> independent
            third-party testing is planned for the next assurance cycle; redacted summaries are provided when approved for
            distribution.
          </li>
          <li>
            Internal security assessments continue on a rolling cadence; detailed summaries are shared during diligence under
            confidentiality.
          </li>
        </ul>
      </section>

      <section
        id="trust-contact-review"
        aria-labelledby="trust-contact-review-heading"
        className="rounded-xl border-2 border-neutral-200 bg-white px-5 py-5 shadow-md dark:border-neutral-700 dark:bg-neutral-900/50"
      >
        <h2 id="trust-contact-review-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Security contact
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-neutral-700 dark:text-neutral-300">
          Email{" "}
          <Link
            className="font-medium text-blue-800 underline underline-offset-2 hover:text-blue-950 dark:text-blue-300 dark:hover:text-blue-200"
            href="mailto:security@archlucid.net"
          >
            security@archlucid.net
          </Link>
          . We send the current public-safe evidence summary by email to ensure buyers receive the latest approved version.
        </p>
      </section>
    </div>
  );
}
