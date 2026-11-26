"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SPECIALTY_TEMPLATE_AUTHORITY_LOAD_FAILURE_LINE,
  SPECIALTY_TEMPLATE_AUTHORITY_LOAD_FAILURE_RETRY_LABEL,
} from "@/lib/help/specialty-template-authority-load-failure-copy";
import { cn } from "@/lib/utils";

type SpecialtyTemplateAuthorityLoadFailurePanelProps = {
  readonly onRetry: () => void;
};

export function SpecialtyTemplateAuthorityLoadFailurePanel(
  props: SpecialtyTemplateAuthorityLoadFailurePanelProps,
): React.JSX.Element {
  return (
    <div
      className={cn(OPERATOR_TYPOGRAPHY.helper, "max-w-3xl space-y-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950")}
      data-testid="specialty-template-authority-load-failure"
      role="alert"
    >
      <p className="m-0">{SPECIALTY_TEMPLATE_AUTHORITY_LOAD_FAILURE_LINE}</p>
      <Button type="button" size="sm" variant="outline" onClick={props.onRetry} data-testid="specialty-template-authority-load-failure-retry">
        {SPECIALTY_TEMPLATE_AUTHORITY_LOAD_FAILURE_RETRY_LABEL}
      </Button>
    </div>
  );
}
