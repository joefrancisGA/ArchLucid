import Link from "next/link";

import { LayerHeader } from "@/components/LayerHeader";
import {
  OPERATOR_SECURITY_TRUST_AVAILABLE_NOW_ITEMS,
  OPERATOR_SECURITY_TRUST_NDA_EMAIL,
  OPERATOR_SECURITY_TRUST_NDA_INTRO,
  OPERATOR_SECURITY_TRUST_ROADMAP_ITEMS,
} from "@/lib/operator-security-trust-content";

const linkClassName =
  "text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200";

function SecurityTrustLinkItem({
  label,
  href,
}: {
  readonly label: string;
  readonly href: string;
}) {
  if (href.startsWith("mailto:")) {
    return (
      <li>
        <a className={linkClassName} href={href}>
          {label}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link className={linkClassName} href={href}>
        {label}
      </Link>
    </li>
  );
}

/** Procurement-oriented trust center (operator shell). */
export function OperatorSecurityTrustPageView() {
  return (
    <div className="space-y-6">
      <LayerHeader density="compact" pageKey="security-trust" />

      <section aria-label="Available now" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full border border-emerald-700/40 bg-al-surface-raised px-2.5 py-0.5 text-xs font-semibold text-al-text-primary dark:border-emerald-800/50">
            Available now
          </span>
          <h2 className="m-0 text-sm font-semibold text-al-text-primary">Public and procurement-ready materials</h2>
        </div>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          Security posture is documented through policies, self-assessments, and procurement materials.
        </p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            {OPERATOR_SECURITY_TRUST_AVAILABLE_NOW_ITEMS.map((item) => (
              <SecurityTrustLinkItem href={item.href} key={item.label} label={item.label} />
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Under NDA" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-0.5 text-xs font-semibold text-al-text-primary dark:border-neutral-600">
            Under NDA
          </span>
          <h2 className="m-0 text-sm font-semibold text-al-text-primary">Diligence-only materials</h2>
        </div>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          Shared under NDA; report bodies are not published on this page.
        </p>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
          <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-sky-950/90 dark:text-sky-100/90">
            <li>Redacted penetration-test summaries (when available)</li>
            <li>Internal security assessment summaries for diligence review</li>
          </ul>
          <p className="m-0 mt-3 text-sm text-sky-950/90 dark:text-sky-100/90">
            {OPERATOR_SECURITY_TRUST_NDA_INTRO} Contact{" "}
            <a className={`font-medium ${linkClassName}`} href={`mailto:${OPERATOR_SECURITY_TRUST_NDA_EMAIL}`}>
              {OPERATOR_SECURITY_TRUST_NDA_EMAIL}
            </a>{" "}
            to request access.
          </p>
        </div>
      </section>

      <section aria-label="Roadmap" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
            Roadmap
          </span>
          <h2 className="m-0 text-sm font-semibold text-al-text-primary">Planned security maturity</h2>
        </div>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Planned work — not yet available.</p>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
          <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-violet-950/90 dark:text-violet-100/90">
            {OPERATOR_SECURITY_TRUST_ROADMAP_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-label="Need security review support?"
        className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      >
        <h2 className="m-0 text-sm font-semibold text-al-text-primary">Need security review support?</h2>
        <p className="m-0 mt-1.5 text-sm text-neutral-700 dark:text-neutral-300">
          Contact{" "}
          <a className={`font-medium ${linkClassName}`} href={`mailto:${OPERATOR_SECURITY_TRUST_NDA_EMAIL}`}>
            {OPERATOR_SECURITY_TRUST_NDA_EMAIL}
          </a>{" "}
          for procurement packs, questionnaire alignment, or NDA-gated materials.
        </p>
      </section>

      <details className="rounded-lg border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-al-text-primary">Badge legend</summary>
        <div className="overflow-x-auto border-t border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-900/60">
              <tr>
                <th className="border-b border-neutral-200 px-3 py-2 font-semibold dark:border-neutral-800">Label</th>
                <th className="border-b border-neutral-200 px-3 py-2 font-semibold dark:border-neutral-800">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-neutral-100 px-3 py-2 font-medium dark:border-neutral-800/80">
                  Available now
                </td>
                <td className="border-b border-neutral-100 px-3 py-2 text-neutral-700 dark:border-neutral-800/80 dark:text-neutral-300">
                  Active and accessible without NDA.
                </td>
              </tr>
              <tr>
                <td className="border-b border-neutral-100 px-3 py-2 font-medium dark:border-neutral-800/80">
                  Under NDA
                </td>
                <td className="border-b border-neutral-100 px-3 py-2 text-neutral-700 dark:border-neutral-800/80 dark:text-neutral-300">
                  Shared under NDA; report body not published publicly.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Roadmap</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">Planned; not yet available.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
