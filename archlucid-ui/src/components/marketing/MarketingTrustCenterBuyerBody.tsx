import Link from "next/link";
import type { ReactNode } from "react";

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
          Diligence deep-dives (questionnaire responses, subprocessors, tenancy detail) are delivered through your
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

        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-4 dark:border-blue-950 dark:bg-blue-950/35">
          <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Assurance at a glance</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Available today
              </p>
              <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                <li>Published procurement artifacts and SOC&nbsp;2–aligned control mapping (readiness — not CPA attestation)</li>
                <li>Architecture, operations, and security documentation packs</li>
                <li>Audit-ready evidence packages suitable for diligence questionnaires</li>
              </ul>
            </div>
            <div>
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Procurement path
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
          </div>
        </div>
      </header>

      <section aria-labelledby="trust-security-posture">
        <h2 id="trust-security-posture" className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Security posture summary
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          ArchLucid is built for regulated buyers: tenant isolation, scope-filtered APIs, immutable audit instrumentation for
          material changes, and evidence packs suitable for questionnaires. Detailed control narratives and questionnaire
          responses are shared during diligence.
        </p>
      </section>

      <section aria-labelledby="trust-assurance-artifacts">
        <h2 id="trust-assurance-artifacts" className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Assurance artifacts
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Request the current procurement-ready bundle containing questionnaire pre-fills (for example CAIQ-lite and SIG
          oriented summaries), tenancy and subprocessors overview, SLA summary excerpts, incident response placeholders, and
          security contact references. Detailed reports referenced in questionnaires are commonly shared under confidentiality.
        </p>
      </section>

      <section aria-labelledby="trust-data-handling">
        <h2 id="trust-data-handling" className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Data handling &amp; privacy
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
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

      <section aria-labelledby="trust-procurement">
        <h2 id="trust-procurement" className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Procurement questionnaire response package
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Procurement teams reuse structured answers mapped to ArchLucid&rsquo;s reusable procurement evidence catalogue. Submit
          your intake form requirements and stakeholder list via the{" "}
          <Link
            href="#trust-contact-review"
            className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300"
          >
            Security review contact
          </Link>{" "}
          so we align the artefact bundle to your process.
        </p>
      </section>

      <section aria-labelledby="trust-planned-assurance">
        <h2 id="trust-planned-assurance" className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Planned assurance
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          The items below are roadmap or in-flight — timelines align with your procurement calendar.
        </p>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
          <li>Internal security assessment windows continue on a rolling cadence; buyer-facing summaries are provided during diligence.</li>
          <li>Independent third-party penetration testing is planned for the next assurance cycle; redacted summaries ship when approved for distribution.</li>
          <li>
            CPA-issued SOC&nbsp;2 attestations and formal third-party test reports are referenced when published and approved;
            distribution follows your diligence process.
          </li>
        </ul>
      </section>

      <section id="trust-contact-review" aria-labelledby="trust-contact-review-heading">
        <h2 id="trust-contact-review-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Contact — security review
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-neutral-700 dark:text-neutral-300">
          Email{" "}
          <Link
            className="font-medium text-blue-800 underline underline-offset-2 hover:text-blue-950 dark:text-blue-300 dark:hover:text-blue-200"
            href="mailto:security@archlucid.net"
          >
            security@archlucid.net
          </Link>
        </p>
      </section>
    </div>
  );
}
