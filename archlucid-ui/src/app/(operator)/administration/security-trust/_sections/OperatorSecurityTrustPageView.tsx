import { cn } from "@/lib/utils";
import Link from "next/link";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { StatusTag } from "@/components/StatusTag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  OPERATOR_SECURITY_TRUST_AVAILABLE_NOW_ITEMS,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_DELETION_INSTRUCTION,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_HREF,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_LABEL,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_NOTE,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_HREF,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_LABEL,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_TITLE,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_AVAILABLE_NOW,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA,
  OPERATOR_SECURITY_TRUST_MATURITY_TAGS,
  OPERATOR_SECURITY_TRUST_NDA_EMAIL,
  OPERATOR_SECURITY_TRUST_NDA_INTRO,
  OPERATOR_SECURITY_TRUST_ROADMAP_ITEMS,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_BODY,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_HREF,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_LABEL,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_TITLE,
  type OperatorSecurityTrustMaturityTag,
} from "@/lib/operator-security-trust-content";

const securityTrustLinkClassName = cn(
  OPERATOR_TYPOGRAPHY.body,
  "text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200",
);

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
        <a className={securityTrustLinkClassName} href={href}>
          {label}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link className={securityTrustLinkClassName} href={href}>
        {label}
      </Link>
    </li>
  );
}

function SecurityTrustMaturitySectionHeader({
  maturityTag,
  title,
}: {
  readonly maturityTag: OperatorSecurityTrustMaturityTag;
  readonly title: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
      <StatusTag
        data-testid={`security-trust-maturity-${maturityTag.label}`}
        kind={maturityTag.kind}
        label={maturityTag.label}
      />
      <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{title}</h2>
    </div>
  );
}

/** Procurement-oriented trust center (operator shell). */
export function OperatorSecurityTrustPageView() {
  return (
    <div className={OPERATOR_LAYOUT.sectionStack} data-testid="operator-security-trust-page">
      <OperatorPageHeader
        title={OPERATOR_NAV_LINK_LABELS.securityTrust}
        subtitle="Procurement-ready security and trust materials for this workspace."
        actions={<PageContextualHelpButton />}
      />
      <LayerHeader density="compact" pageKey="security-trust" />

      <section aria-label="Available now" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <SecurityTrustMaturitySectionHeader
          maturityTag={OPERATOR_SECURITY_TRUST_MATURITY_TAG_AVAILABLE_NOW}
          title="Public and procurement-ready materials"
        />
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          Security posture is documented through policies, self-assessments, and procurement materials.
        </p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <ul className={cn("m-0 list-disc space-y-1.5 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_AVAILABLE_NOW_ITEMS.map((item) => (
              <SecurityTrustLinkItem href={item.href} key={item.label} label={item.label} />
            ))}
          </ul>
        </div>
      </section>

      <section aria-label={OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_TITLE} className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_TITLE}</h2>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_BODY}
          </p>
          <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            Technical detail:{" "}
            <Link className={securityTrustLinkClassName} href={OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_HREF}>
              {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_LABEL}
            </Link>
            .
          </p>
        </div>
      </section>

      <section aria-label={OPERATOR_SECURITY_TRUST_DATA_RETENTION_TITLE} className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{OPERATOR_SECURITY_TRUST_DATA_RETENTION_TITLE}</h2>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_DATA_RETENTION_NOTE}
          </p>
          <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_DATA_RETENTION_DELETION_INSTRUCTION}
          </p>
          <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            Contractual terms:{" "}
            <Link className={securityTrustLinkClassName} href={OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_HREF}>
              {OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_LABEL}
            </Link>
            {" · "}
            <Link className={securityTrustLinkClassName} href={OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_HREF}>
              {OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_LABEL}
            </Link>
            .
          </p>
        </div>
      </section>

      <section aria-label="Under NDA" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <SecurityTrustMaturitySectionHeader
          maturityTag={OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA}
          title="Diligence-only materials"
        />
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          Shared under NDA; report bodies are not published on this page.
        </p>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
          <ul className={cn("m-0 list-disc space-y-1.5 pl-5 text-sky-950/90 dark:text-sky-100/90", OPERATOR_TYPOGRAPHY.body)}>
            <li>Redacted penetration-test summaries (when available)</li>
            <li>Internal security assessment summaries for diligence review</li>
          </ul>
          <p className={cn("m-0 mt-3 text-sky-950/90 dark:text-sky-100/90", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_NDA_INTRO} Contact{" "}
            <a className={cn("font-medium", securityTrustLinkClassName)} href={`mailto:${OPERATOR_SECURITY_TRUST_NDA_EMAIL}`}>
              {OPERATOR_SECURITY_TRUST_NDA_EMAIL}
            </a>{" "}
            to request access.
          </p>
        </div>
      </section>

      <section aria-label="Roadmap" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <SecurityTrustMaturitySectionHeader
          maturityTag={OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP}
          title="Planned security maturity"
        />
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Planned work — not yet available.</p>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
          <ul className={cn("m-0 list-disc space-y-1.5 pl-5 text-violet-950/90 dark:text-violet-100/90", OPERATOR_TYPOGRAPHY.body)}>
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
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Need security review support?</h2>
        <p className={cn("m-0 mt-1.5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Contact{" "}
          <a className={cn("font-medium", securityTrustLinkClassName)} href={`mailto:${OPERATOR_SECURITY_TRUST_NDA_EMAIL}`}>
            {OPERATOR_SECURITY_TRUST_NDA_EMAIL}
          </a>{" "}
          for procurement packs, questionnaire alignment, or NDA-gated materials.
        </p>
      </section>

      <details className="rounded-lg border border-neutral-200 dark:border-neutral-800">
        <summary className={cn("cursor-pointer px-4 py-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Badge legend</summary>
        <div className="overflow-x-auto border-t border-neutral-200 dark:border-neutral-800">
          <table className={cn("w-full min-w-[28rem] border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
            <thead className="bg-neutral-100 dark:bg-neutral-900/60">
              <tr>
                <th className="border-b border-neutral-200 px-3 py-2 font-semibold dark:border-neutral-800">Label</th>
                <th className="border-b border-neutral-200 px-3 py-2 font-semibold dark:border-neutral-800">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {OPERATOR_SECURITY_TRUST_MATURITY_TAGS.map((maturityTag) => (
                <tr key={maturityTag.label}>
                  <td className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800/80">
                    <StatusTag
                      data-testid={`security-trust-legend-${maturityTag.label}`}
                      kind={maturityTag.kind}
                      label={maturityTag.label}
                    />
                  </td>
                  <td className="border-b border-neutral-100 px-3 py-2 text-neutral-700 dark:border-neutral-800/80 dark:text-neutral-300">
                    {maturityTag.legendMeaning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
