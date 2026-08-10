import Link from "next/link";

import { ACCELERATOR_CHOOSER_HELP_SOURCES } from "@/lib/accelerator-chooser-help-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Source links for the accelerator chooser help topic (HAX). */
export function HelpAcceleratorChooserSourceLinks(): React.ReactElement {
  return (
    <ul
      className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}
      data-testid="help-accelerator-chooser-source-links"
    >
      {ACCELERATOR_CHOOSER_HELP_SOURCES.map((link) => (
        <li key={`${link.href}-${link.label}`}>
          <Link
            className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
            href={link.href}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
