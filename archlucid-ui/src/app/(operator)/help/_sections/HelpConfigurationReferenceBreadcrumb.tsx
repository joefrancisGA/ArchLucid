import Link from "next/link";

import { CONFIGURATION_REFERENCE_HELP_BREADCRUMB_TOPIC_TITLE } from "@/lib/configuration-reference-help-guide-content";
import {
  HELP_HUB_CANONICAL_PATH,
  HELP_TOPIC_BREADCRUMB_HUB_LABEL,
} from "@/lib/help/help-hub-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Working-mode wayfinding trail: Help → Configuration reference (CON route exception to TB-2090). */
export function HelpConfigurationReferenceBreadcrumb(): React.JSX.Element {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="help-topic-breadcrumb"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          <Link className={OPERATOR_LINK.inline} href={HELP_HUB_CANONICAL_PATH}>
            {HELP_TOPIC_BREADCRUMB_HUB_LABEL}
          </Link>
        </li>
        <li aria-hidden="true" className="text-al-text-secondary">/</li>
        <li aria-current="page" className="text-al-text-primary">
          {CONFIGURATION_REFERENCE_HELP_BREADCRUMB_TOPIC_TITLE}
        </li>
      </ol>
    </nav>
  );
}
