import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_SPECIALTY_TEMPLATE_GRID_FOOTER_LINE } from "@/lib/help/securenow-specialty-template-grid-footer-copy";
import { cn } from "@/lib/utils";

export function HelpSpecialtyWalkthroughTemplateGridFooter(): React.JSX.Element {
  return (
    <p
      className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="specialty-template-grid-synthetic-footer"
    >
      {SECURENOW_SPECIALTY_TEMPLATE_GRID_FOOTER_LINE}
    </p>
  );
}
