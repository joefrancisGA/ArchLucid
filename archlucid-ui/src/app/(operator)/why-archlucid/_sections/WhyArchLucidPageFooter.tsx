import Link from "next/link";

import { cn } from "@/lib/utils";
import { BUYER_WHY_ARCHLUCID_SOURCES_LINE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_ARCHLUCID_FOOTER_SPONSOR_BRIEF_HREF,
  WHY_ARCHLUCID_FOOTER_SPONSOR_BRIEF_LABEL,
  WHY_ARCHLUCID_FOOTER_GETTING_STARTED_HREF,
  WHY_ARCHLUCID_FOOTER_GETTING_STARTED_LABEL,
  WHY_ARCHLUCID_FOOTER_TRUST_CENTER_HREF,
  WHY_ARCHLUCID_FOOTER_TRUST_CENTER_LABEL,
} from "@/lib/why-archlucid-page-copy";

export function WhyArchLucidPageFooter() {
  return (
    <footer
      className={cn("border-t border-neutral-200 pt-3 text-al-text-secondary dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="why-archlucid-page-footer"
    >
      {BUYER_WHY_ARCHLUCID_SOURCES_LINE}{" "}
      <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-200" href={WHY_ARCHLUCID_FOOTER_SPONSOR_BRIEF_HREF}>
        {WHY_ARCHLUCID_FOOTER_SPONSOR_BRIEF_LABEL}
      </Link>
      {" · "}
      <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-200" href={WHY_ARCHLUCID_FOOTER_GETTING_STARTED_HREF}>
        {WHY_ARCHLUCID_FOOTER_GETTING_STARTED_LABEL}
      </Link>
      {" · "}
      <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-200" href={WHY_ARCHLUCID_FOOTER_TRUST_CENTER_HREF}>
        {WHY_ARCHLUCID_FOOTER_TRUST_CENTER_LABEL}
      </Link>
    </footer>
  );
}
