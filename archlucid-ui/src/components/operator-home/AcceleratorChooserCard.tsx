import { cn } from "@/lib/utils";

import { AcceleratorJobChooserList } from "@/components/accelerator/AcceleratorJobChooserList";
import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Surfaces buyer-job → starter proof pack picks after first commit (TB-114). */
export function AcceleratorChooserCard(): React.JSX.Element {
  return (
    <section aria-labelledby="accelerator-chooser-heading" data-testid="accelerator-chooser-card">
      <Card className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <CardHeader className="space-y-1">
          <h2
            id="accelerator-chooser-heading"
            className={cn("m-0 tracking-tight text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            Pick a starter proof pack
          </h2>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            After your first committed review, choose a buyer job — each row maps to an existing pack in the repo.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <OperatorHomeGuidanceLink helpSlug="accelerator-chooser" label="Open the full accelerator chooser guide" />
          </div>
        </CardHeader>
        <CardContent>
          <AcceleratorJobChooserList />
        </CardContent>
      </Card>
    </section>
  );
}
