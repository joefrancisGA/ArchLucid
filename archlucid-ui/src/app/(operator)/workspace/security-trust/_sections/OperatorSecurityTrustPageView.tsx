import Link from "next/link";

import { LayerHeader } from "@/components/LayerHeader";

import { OPERATOR_SECURITY_TRUST_DOCS_REPO_BASE } from "./operator-security-trust-docs-repo-base";

/** Procurement-oriented strip plus NDA-gated pen-test posture (operator shell). */
export function OperatorSecurityTrustPageView() {
  return (
    <div className="space-y-6">
      <LayerHeader pageKey="security-trust" />

      <section aria-label="Available now" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full border border-emerald-700/40 bg-al-surface-raised px-2.5 py-0.5 text-xs font-semibold text-al-text-primary dark:border-emerald-800/50">
            Available now
          </span>
          <h2 className="m-0 text-sm font-semibold text-al-text-primary">
            Trust Center &amp; governance posture
          </h2>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            <li>
              <strong>Trust Center</strong> — policies, DPA template, subprocessors, SOC 2 self-assessment, CAIQ / SIG:{" "}
              <Link
                className="text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200"
                href={`${OPERATOR_SECURITY_TRUST_DOCS_REPO_BASE}/docs/go-to-market/TRUST_CENTER.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Trust Center (markdown)
              </Link>
            </li>
            <li>Security posture communicated through documented policies and self-assessment — not embedded assessment artifacts.</li>
            <li>
              Procurement questions: <a className="text-sky-700 underline dark:text-sky-400" href="mailto:security@archlucid.net">security@archlucid.net</a>
            </li>
          </ul>
        </div>
      </section>

      <section aria-label="Under NDA" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-0.5 text-xs font-semibold text-al-text-primary dark:border-neutral-600">
            Under NDA
          </span>
          <h2 className="m-0 text-sm font-semibold text-al-text-primary">
            Third-party security assessments
          </h2>
        </div>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3">
          <p className="m-0 text-sm text-sky-950/90 dark:text-sky-100/90">
            Pen-test redacted summaries are shared <strong>under NDA only</strong>. The public Trust Center records engagement
            existence and high-level posture. To request the most recent redacted summary, email{" "}
            <a
              className="font-medium text-sky-800 underline underline-offset-2 hover:text-sky-950 dark:text-sky-300 dark:hover:text-sky-100"
              href="mailto:security@archlucid.net"
            >
              security@archlucid.net
            </a>
            .
          </p>
        </div>
      </section>

      <section aria-label="Roadmap" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
            Roadmap
          </span>
          <h2 className="m-0 text-sm font-semibold text-al-text-primary">
            Planned security maturity
          </h2>
        </div>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3">
          <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-violet-950/90 dark:text-violet-100/90">
            <li>Formal SOC 2 Type II audit engagement (planned)</li>
            <li>ISO 27001 alignment documentation</li>
            <li>Automated compliance evidence export from architecture review packages</li>
          </ul>
        </div>
      </section>

      <section aria-label="Badge legend" className="space-y-2">
        <h2 className="text-sm font-semibold text-al-text-primary">Badge legend</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-900/60">
              <tr>
                <th className="border-b border-neutral-200 px-3 py-2 font-semibold dark:border-neutral-800">Label</th>
                <th className="border-b border-neutral-200 px-3 py-2 font-semibold dark:border-neutral-800">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-neutral-100 px-3 py-2 font-medium dark:border-neutral-800/80">Available now</td>
                <td className="border-b border-neutral-100 px-3 py-2 text-neutral-700 dark:border-neutral-800/80 dark:text-neutral-300">Active and accessible to buyers without NDA.</td>
              </tr>
              <tr>
                <td className="border-b border-neutral-100 px-3 py-2 font-medium dark:border-neutral-800/80">Under NDA</td>
                <td className="border-b border-neutral-100 px-3 py-2 text-neutral-700 dark:border-neutral-800/80 dark:text-neutral-300">Shared under NDA; report body not published publicly.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Roadmap</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">Planned; not yet available.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
