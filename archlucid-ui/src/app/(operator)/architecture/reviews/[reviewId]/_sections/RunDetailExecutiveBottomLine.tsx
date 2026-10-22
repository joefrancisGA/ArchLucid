import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SponsorBottomLineContent } from "@/lib/run-detail-workspace-derive";

type RunDetailSponsorBottomLineProps = {
  readonly content: SponsorBottomLineContent | null;
};

export function RunDetailSponsorBottomLine(props: RunDetailSponsorBottomLineProps): ReactElement | null {
  const { content } = props;

  if (content === null) {
    return null;
  }

  if (content.kind === "narrative") {
    return (
      <Card className="border-l-4 border-l-neutral-700 dark:border-l-neutral-400">
        <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Additional context
        </CardTitle>
        </CardHeader>
        <CardContent className={OPERATOR_CARD.content}>
          <p className={cn("m-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{content.text}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-neutral-700 dark:border-l-neutral-400">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Key decision considerations
        </CardTitle>
      </CardHeader>
      <CardContent className={OPERATOR_CARD.content}>
        <ul className={cn("m-0 list-disc space-y-2 pl-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {content.themes.map((theme) => (
            <li key={theme} className="leading-relaxed">
              {theme}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
