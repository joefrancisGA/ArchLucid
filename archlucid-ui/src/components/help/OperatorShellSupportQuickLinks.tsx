import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_SHELL_SUPPORT_QUICK_LINKS } from "@/lib/operator/operator-shell-support-affordances";
import { cn } from "@/lib/utils";

type OperatorShellSupportQuickLinksProps = {
  readonly className?: string;
  readonly onNavigate?: () => void;
};

/** Persistent support entry points in help drawer footers (all operator roles). */
export function OperatorShellSupportQuickLinks({
  className,
  onNavigate,
}: OperatorShellSupportQuickLinksProps): React.JSX.Element {
  const { contactSupportPage, reportProblem, emailSupport } = OPERATOR_SHELL_SUPPORT_QUICK_LINKS;

  return (
    <p
      className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper, className)}
      data-testid="operator-shell-support-quick-links"
    >
      <Link href={contactSupportPage.href} className={OPERATOR_LINK.nav} onClick={onNavigate}>
        {contactSupportPage.label}
      </Link>
      {" · "}
      <Link href={reportProblem.href} className={OPERATOR_LINK.nav} onClick={onNavigate}>
        {reportProblem.label}
      </Link>
      {" · "}
      <a href={emailSupport.href} className={OPERATOR_LINK.nav}>
        {emailSupport.label}
      </a>
    </p>
  );
}
