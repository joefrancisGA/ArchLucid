import { cn } from "@/lib/utils";

import { AcceleratorJobChooserList } from "@/components/accelerator/AcceleratorJobChooserList";
import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ACCELERATOR_CHOOSER_HOME_CARD_LEAD,
  ACCELERATOR_CHOOSER_HOME_CARD_TITLE,
  ACCELERATOR_CHOOSER_HOME_GUIDANCE_LINK_LABEL,
  ACCELERATOR_CHOOSER_HOME_HELP_SLUG,
} from "@/lib/accelerator-chooser-home-inbound-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Surfaces buyer-job → accelerator pack picks after first commit (TB-114). */
export function AcceleratorChooserCard(): React.JSX.Element {
  return (
    <section aria-labelledby="accelerator-chooser-heading" data-testid="accelerator-chooser-card">
      <Card className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <CardHeader className="space-y-1">
          <h2
            id="accelerator-chooser-heading"
            className={cn("m-0 tracking-tight text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {ACCELERATOR_CHOOSER_HOME_CARD_TITLE}
          </h2>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {ACCELERATOR_CHOOSER_HOME_CARD_LEAD}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <OperatorHomeGuidanceLink
              helpSlug={ACCELERATOR_CHOOSER_HOME_HELP_SLUG}
              label={ACCELERATOR_CHOOSER_HOME_GUIDANCE_LINK_LABEL}
            />
          </div>
        </CardHeader>
        <CardContent>
          <AcceleratorJobChooserList />
        </CardContent>
      </Card>
    </section>
  );
}
