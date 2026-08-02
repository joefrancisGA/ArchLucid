"use client";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { IMPACT_PREVIEW_OUTPUT_PREVIEW_ITEMS, IMPACT_PREVIEW_OUTPUT_PREVIEW_TITLE } from "@/lib/impact-preview-page-copy";

export function ImpactPreviewOutputPreviewPanel(): React.JSX.Element {
  return (
    <Card className="border-dashed bg-neutral-50/60 dark:bg-neutral-900/20" data-testid="impact-preview-output-preview">
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.cardTitle)}>{IMPACT_PREVIEW_OUTPUT_PREVIEW_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {IMPACT_PREVIEW_OUTPUT_PREVIEW_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
