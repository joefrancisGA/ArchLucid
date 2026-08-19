import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PatternLibraryDomainPlatformBadges,
  PatternLibrarySignalBadges,
} from "./PatternLibraryFiltersPanel";
import { PatternLibraryRelatedPolicyPacks } from "./PatternLibraryPolicyGuidance";
import { OPERATOR_CARD, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { patternLibraryDetailPath } from "@/lib/pattern-library-route";
import type { PatternLibraryRecord } from "@/lib/pattern-library-types";
import { cn } from "@/lib/utils";

type PatternLibraryPatternCardProps = {
  readonly record: PatternLibraryRecord;
};

export function PatternLibraryPatternCard(props: PatternLibraryPatternCardProps): React.JSX.Element {
  const { record } = props;
  const detailPath = patternLibraryDetailPath(record.patternKey);

  return (
    <Card
      className="h-full border-neutral-200 dark:border-neutral-800"
      data-testid={`pattern-library-card-${record.patternKey}`}
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>{record.name}</CardTitle>
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{record.patternType}</span>
        </div>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{record.description}</p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
        <PatternLibraryDomainPlatformBadges domains={record.domains} platforms={record.platforms} />
        <PatternLibrarySignalBadges
          adoption={record.adoption}
          risk={record.risk}
          governance={record.governance}
        />
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {record.reviewCountLabel} · {record.tenantCountLabel}
        </p>
        <PatternLibraryRelatedPolicyPacks packs={record.relatedPolicyPacks} />
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm" variant="primary">
            <Link href={detailPath}>Open pattern</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/architecture/reviews/new?pattern=${encodeURIComponent(record.patternKey)}`}>Use in review</Link>
          </Button>
          <Link href={`${detailPath}#alternatives`} className={cn("self-center", OPERATOR_LINK.optional)}>
            Compare peer patterns
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
