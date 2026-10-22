import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { IMPACT_PREVIEW_SETUP_CARD_TITLE } from "@/lib/impact-preview-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const SKELETON_BLOCK_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves simulation setup layout during list refresh so controls do not collapse. */
export function ImpactPreviewSetupSkeleton(): React.JSX.Element {
  return (
    <Card data-testid="impact-preview-setup-skeleton" aria-busy="true">
      <CardHeader className="pb-3">
        <p className={OPERATOR_TYPOGRAPHY.cardTitle}>{IMPACT_PREVIEW_SETUP_CARD_TITLE}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={SKELETON_BLOCK_CLASS} />
        <div className={SKELETON_BLOCK_CLASS} />
        <div className="h-9 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </CardContent>
    </Card>
  );
}
