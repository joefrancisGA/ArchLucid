import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function WhyArchLucidPageHeader() {
  return (
    <header className="space-y-2">
      <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Why ArchLucid</h1>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        See how ArchLucid turns architecture review into a governed decision package — executive summary, signed
        review record, evidence trail, governance approval, and audit record — using the Claims Intake sample workspace as a
        walkthrough.
      </p>
    </header>
  );
}
