import { cn } from "@/lib/utils";

import Link from "next/link";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { StatusTag } from "@/components/StatusTag";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_DELETION_INSTRUCTION,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_HREF,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_LABEL,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_NOTE,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_HREF,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_LABEL,
  OPERATOR_SECURITY_TRUST_DATA_RETENTION_TITLE,
  OPERATOR_SECURITY_TRUST_MATERIAL_ITEMS,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_AVAILABLE_NOW,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA,
  OPERATOR_SECURITY_TRUST_MATURITY_TAGS,
  OPERATOR_SECURITY_TRUST_NDA_APPROVAL_ONLY,
  OPERATOR_SECURITY_TRUST_NDA_REQUEST_HREF,
  OPERATOR_SECURITY_TRUST_NDA_REQUEST_LABEL,
  OPERATOR_SECURITY_TRUST_NDA_SHARED_TODAY,
  OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_ITEM,
  OPERATOR_SECURITY_TRUST_ROADMAP_ITEMS,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_AUDIT_TRAIL_HREF,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_AUDIT_TRAIL_LABEL,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_HREF,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_LABEL,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_ENFORCED_BODY,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_ENFORCED_LABEL,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_EVIDENCE_LABEL,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SCOPE_BODY,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SCOPE_LABEL,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_TITLE,
  resolveOperatorSecurityTrustMaterialAvailability,
  resolveOperatorSecurityTrustMaterialReviewedLabel,
  type OperatorSecurityTrustMaterialItem,
  type OperatorSecurityTrustMaturityTag,
} from "@/lib/operator/operator-security-trust-content";
import {
  OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION,
  OPERATOR_SECURITY_TRUST_PAGE_NAV_HREF,
  OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_LABEL,
  OPERATOR_SECURITY_TRUST_SECONDARY_MATERIALS_HEADING,
} from "@/lib/operator/operator-security-trust-page-copy";
import { resolveTrustAssuranceSecurityTrustPeerLinks } from "@/lib/vocabulary/trust-assurance-security-trust-vocabulary";
import { SECURITY_TRUST_HELP_HUB_HELP_LINK } from "@/lib/vocabulary/security-trust-help-hub-vocabulary";

function SecurityTrustMaterialLink({
  item,
}: {
  readonly item: OperatorSecurityTrustMaterialItem;
}) {
  return (
    <Link className={OPERATOR_LINK.inline} href={item.href}>
      {item.label}
    </Link>
  );
}

function SecurityTrustMaturitySectionHeader({
  maturityTag,
  title,
  headingId,
}: {
  readonly maturityTag: OperatorSecurityTrustMaturityTag;
  readonly title: string;
  readonly headingId: string;
}) {
  return (
    <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
      <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
        <StatusTag
          data-testid={`security-trust-maturity-${maturityTag.label}`}
          kind={maturityTag.kind}
          label={maturityTag.label}
        />
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)} id={headingId}>
          {title}
        </h2>
      </div>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{maturityTag.legendMeaning}</p>
    </div>
  );
}

function SecurityTrustMaterialsTable() {
  return (
    <EnterpriseTable
      ariaLabel="Procurement materials inventory"
      className={OPERATOR_TYPOGRAPHY.body}
      data-testid="security-trust-materials-table"
    >
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Material</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>What it is</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Availability</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Reviewed</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {OPERATOR_SECURITY_TRUST_MATERIAL_ITEMS.map((item) => {
          const registryEntry =
            item.docSlug !== undefined ? getProductDocumentationEntry(item.docSlug) : null;

          return (
            <EnterpriseTableRow key={item.label} data-testid={`security-trust-material-row-${item.docSlug ?? item.label}`}>
              <EnterpriseTableCell>
                <SecurityTrustMaterialLink item={item} />
                {registryEntry !== null && registryEntry.pdfStatus === "public" ? (
                  <div className="mt-2">
                    <HelpTopicPdfDownloadButton entry={registryEntry} />
                  </div>
                ) : null}
              </EnterpriseTableCell>
              <EnterpriseTableCell className="text-neutral-700 dark:text-neutral-300">{item.whatItIs}</EnterpriseTableCell>
              <EnterpriseTableCell
                className="text-neutral-700 dark:text-neutral-300"
                data-testid={`security-trust-material-availability-${item.docSlug ?? "unknown"}`}
              >
                {resolveOperatorSecurityTrustMaterialAvailability(item.docSlug)}
              </EnterpriseTableCell>
              <EnterpriseTableCell
                className="text-neutral-700 dark:text-neutral-300"
                data-testid={`security-trust-material-reviewed-${item.docSlug ?? "unknown"}`}
              >
                {resolveOperatorSecurityTrustMaterialReviewedLabel(item.docSlug)}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

function SecurityTrustRelatedSurfacesDisclosure() {
  const trustAssurancePeers = resolveTrustAssuranceSecurityTrustPeerLinks("security-trust-hub");

  return (
    <details
      className="rounded-lg border border-neutral-200 dark:border-neutral-800"
      data-testid="security-trust-related-surfaces-disclosure"
    >
      <summary className={cn("cursor-pointer px-4 py-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Related trust surfaces
      </summary>
      <div className="space-y-4 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <ul className={cn("m-0 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {trustAssurancePeers.map((peer) => (
            <li key={peer.id} data-testid={`security-trust-related-surface-${peer.id}`}>
              <Link className={OPERATOR_LINK.inline} href={peer.href}>
                {peer.label}
              </Link>
              <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                {peer.whenToUse}
              </p>
            </li>
          ))}
          <li data-testid="security-trust-related-surface-security-trust-help">
            <Link className={OPERATOR_LINK.inline} href={SECURITY_TRUST_HELP_HUB_HELP_LINK.href}>
              {SECURITY_TRUST_HELP_HUB_HELP_LINK.label}
            </Link>
            <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              {SECURITY_TRUST_HELP_HUB_HELP_LINK.whenToUse}
            </p>
          </li>
        </ul>
        <div>
          <p className={cn("m-0 mb-2 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Badge legend
          </p>
          <EnterpriseTable ariaLabel="Security trust maturity badge legend" className={OPERATOR_TYPOGRAPHY.body}>
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Label</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Meaning</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {OPERATOR_SECURITY_TRUST_MATURITY_TAGS.map((maturityTag) => (
                <EnterpriseTableRow key={maturityTag.label}>
                  <EnterpriseTableCell>
                    <StatusTag
                      data-testid={`security-trust-legend-${maturityTag.label}`}
                      kind={maturityTag.kind}
                      label={maturityTag.label}
                    />
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="text-neutral-700 dark:text-neutral-300">
                    {maturityTag.legendMeaning}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </div>
      </div>
    </details>
  );
}

/** Procurement-oriented trust center (operator shell). */
export function OperatorSecurityTrustPageView() {
  return (
    <div className={OPERATOR_LAYOUT.sectionStack} data-testid="operator-security-trust-page">
      <OperatorPageHeader
        navHref={OPERATOR_SECURITY_TRUST_PAGE_NAV_HREF}
        title={OPERATOR_NAV_LINK_LABELS.securityTrust}
        subtitle={OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION}
        headingLevel="h1"
        titleTestId="operator-security-trust-page-title"
        actions={<PageContextualHelpButton />}
      />

      <section
        aria-labelledby="security-trust-section-available-now-heading"
        className={OPERATOR_LAYOUT.sectionHeadingStack}
      >
        <SecurityTrustMaturitySectionHeader
          maturityTag={OPERATOR_SECURITY_TRUST_MATURITY_TAG_AVAILABLE_NOW}
          title="Public and procurement-ready materials"
          headingId="security-trust-section-available-now-heading"
        />
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <div className="space-y-4">
            <Button asChild size="sm" variant="primary" data-testid="security-trust-primary-trust-center">
              <Link href={OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_ITEM.href}>
                {OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_LABEL}
              </Link>
            </Button>
            <div className="space-y-2">
              <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
                {OPERATOR_SECURITY_TRUST_SECONDARY_MATERIALS_HEADING}
              </p>
              <SecurityTrustMaterialsTable />
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="security-trust-section-tenant-isolation-heading"
        className={OPERATOR_LAYOUT.sectionHeadingStack}
      >
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)} id="security-trust-section-tenant-isolation-heading">
          {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_TITLE}
        </h2>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <dl className={cn("m-0 space-y-3", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className="font-medium text-neutral-800 dark:text-neutral-200">
                {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_ENFORCED_LABEL}
              </dt>
              <dd className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">
                {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_ENFORCED_BODY}
              </dd>
            </div>
            <div data-testid="security-trust-tenant-isolation-scope">
              <dt className="font-medium text-neutral-800 dark:text-neutral-200">
                {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SCOPE_LABEL}
              </dt>
              <dd className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">
                {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SCOPE_BODY}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-800 dark:text-neutral-200">
                {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_EVIDENCE_LABEL}
              </dt>
              <dd className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">
                <Link className={OPERATOR_LINK.inline} href={OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_HREF}>
                  {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_LABEL}
                </Link>
                {" · "}
                <Link className={OPERATOR_LINK.inline} href={OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_AUDIT_TRAIL_HREF}>
                  {OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_AUDIT_TRAIL_LABEL}
                </Link>
                .
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        aria-labelledby="security-trust-section-data-retention-heading"
        className={OPERATOR_LAYOUT.sectionHeadingStack}
      >
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)} id="security-trust-section-data-retention-heading">
          {OPERATOR_SECURITY_TRUST_DATA_RETENTION_TITLE}
        </h2>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_DATA_RETENTION_NOTE}
          </p>
          <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_DATA_RETENTION_DELETION_INSTRUCTION}
          </p>
          <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            Contractual terms:{" "}
            <Link className={OPERATOR_LINK.inline} href={OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_HREF}>
              {OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_LABEL}
            </Link>
            {" · "}
            <Link className={OPERATOR_LINK.inline} href={OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_HREF}>
              {OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_LABEL}
            </Link>
            .
          </p>
        </div>
      </section>

      <section aria-labelledby="security-trust-section-nda-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <SecurityTrustMaturitySectionHeader
          maturityTag={OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA}
          title="Diligence-only materials"
          headingId="security-trust-section-nda-heading"
        />
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_NDA_SHARED_TODAY}
          </p>
          <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_NDA_APPROVAL_ONLY}{" "}
            <a className={OPERATOR_LINK.inline} href={OPERATOR_SECURITY_TRUST_NDA_REQUEST_HREF}>
              {OPERATOR_SECURITY_TRUST_NDA_REQUEST_LABEL}
            </a>
            .
          </p>
        </div>
      </section>

      <section
        aria-labelledby="security-trust-section-roadmap-heading"
        className={OPERATOR_LAYOUT.sectionHeadingStack}
      >
        <SecurityTrustMaturitySectionHeader
          maturityTag={OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP}
          title="Planned security maturity"
          headingId="security-trust-section-roadmap-heading"
        />
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
          <ul className={cn("m-0 list-disc space-y-1.5 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {OPERATOR_SECURITY_TRUST_ROADMAP_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <SecurityTrustRelatedSurfacesDisclosure />
    </div>
  );
}
