"use client";

import Link from "next/link";

import { PatternLibraryDomainPlatformBadges, PatternLibrarySignalBadges } from "./PatternLibraryFiltersPanel";
import {
  PatternLibraryRelatedPolicyPacks,
  PatternLibraryRelatedPolicyRules,
} from "./PatternLibraryPolicyGuidance";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { findPatternLibraryRecord } from "@/lib/pattern-library-catalog";
import { resolvePatternLibraryPeerCompare } from "@/lib/pattern-library-peer-compare";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { PATTERN_LIBRARY_POLICY_RULES_SECTION_TITLE } from "@/lib/pattern-library-policy-guidance-copy";
import { usePatternLibraryProvenance } from "@/lib/use-pattern-library-provenance";
import { cn } from "@/lib/utils";

type PatternLibraryDetailClientProps = {
  readonly patternKey: string;
};

function DetailSection(props: { readonly id: string; readonly title: string; readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <section id={props.id} className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "space-y-2")}>
      <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{props.title}</h2>
      <div className={OPERATOR_TYPOGRAPHY.body}>{props.children}</div>
    </section>
  );
}

export function PatternLibraryDetailClient(props: PatternLibraryDetailClientProps): React.JSX.Element {
  const { provenance } = usePatternLibraryProvenance();
  const record = findPatternLibraryRecord(props.patternKey);
  const peerCompare = record === null ? null : resolvePatternLibraryPeerCompare(record.patternKey);

  if (record === null) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.body} role="alert">
        Pattern not found.
      </p>
    );
  }

  return (
    <div className={cn("w-full max-w-4xl", OPERATOR_LAYOUT.majorSectionGap)} data-testid="pattern-library-detail-page">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <Link href={PATTERN_LIBRARY_PATH} className={OPERATOR_LINK.nav}>
          ← Pattern library
        </Link>
      </p>

      <OperatorPageHeader
        title={record.name}
        subtitle={record.description}
        titleTestId="pattern-library-detail-title"
        actions={<PageContextualHelpButton />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" data-testid="pattern-library-detail-provenance-badge">
            {provenance.badgeLabel}
          </Badge>
          <PatternLibraryDomainPlatformBadges domains={record.domains} platforms={record.platforms} />
          <PatternLibrarySignalBadges adoption={record.adoption} risk={record.risk} governance={record.governance} />
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            {record.reviewCountLabel} · {record.tenantCountLabel}
          </p>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{provenance.notice}</p>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.micro)}>{provenance.privacyNote}</p>
        </div>
      </OperatorPageHeader>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="primary">
          <Link href={`/architecture/reviews/new?pattern=${encodeURIComponent(record.patternKey)}`}>Use in review</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={PATTERN_LIBRARY_PATH}>Back to library</Link>
        </Button>
      </div>

      <div className={OPERATOR_LAYOUT.sectionStack}>
        <DetailSection id="overview" title="Overview">
          <p className="m-0">{record.overview}</p>
        </DetailSection>

        <DetailSection id="where-appears" title="Where this pattern appears">
          <p className="m-0">{record.whereAppears}</p>
        </DetailSection>

        <DetailSection id="platforms-domains" title="Common platforms and domains">
          <PatternLibraryDomainPlatformBadges domains={record.domains} platforms={record.platforms} />
        </DetailSection>

        <DetailSection id="typical-risks" title="Typical risks">
          <ul className="m-0 list-disc space-y-1 pl-5">
            {record.typicalRisks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection id="required-evidence" title="Required evidence">
          <ul className="m-0 list-disc space-y-1 pl-5">
            {record.requiredEvidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection id="governance" title="Governance considerations">
          <ul className="m-0 list-disc space-y-1 pl-5">
            {record.governanceConsiderations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection id="policy-rules" title={PATTERN_LIBRARY_POLICY_RULES_SECTION_TITLE}>
          <PatternLibraryRelatedPolicyRules rules={record.relatedPolicyRules} />
        </DetailSection>

        {record.relatedPolicyPacks.length > 0 ? (
          <DetailSection id="policy-packs" title="Related policy packs">
            <PatternLibraryRelatedPolicyPacks packs={record.relatedPolicyPacks} />
          </DetailSection>
        ) : null}

        <DetailSection id="alternatives" title="Common alternatives">
          <ul className="m-0 list-disc space-y-1 pl-5">
            {record.alternatives.map((alt) => (
              <li key={alt}>{alt}</li>
            ))}
          </ul>
        </DetailSection>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Example architecture shape</CardTitle>
          </CardHeader>
          <CardContent className={OPERATOR_CARD.content}>
            <p className="m-0">{record.architectureShape}</p>
          </CardContent>
        </Card>

        <DetailSection id="review-questions" title="Review questions to ask">
          <ul className="m-0 list-disc space-y-1 pl-5">
            {record.reviewQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </DetailSection>
      </div>

      <Card className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20">
        <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            Use this pattern as a starting point for a new architecture review or compare it with peer patterns in the library.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/architecture/reviews/new?pattern=${encodeURIComponent(record.patternKey)}`}>
                Use this pattern in a new review
              </Link>
            </Button>
            {peerCompare !== null ? (
              <Button asChild size="sm" variant="outline">
                <Link href={peerCompare.href}>{peerCompare.label}</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
