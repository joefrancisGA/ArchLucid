import { GLOSSARY_HELP_CLAIM_DISCIPLINE } from "@/lib/glossary-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/glossary` — no diligence Sources list (TB-2092). */
export function GlossaryHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <aside className={cn(DESIGN_TOKENS.callout.warn, "p-3")} data-testid="glossary-help-claim-discipline">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{GLOSSARY_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
