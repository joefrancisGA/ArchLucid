import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

const NEXT_STEPS = [
  {
    label: "Request the procurement pack",
    href: inAppHelpHref("procurement"),
    description: "SIG/CAIQ-style accelerator rows and honest status vocabulary.",
  },
  {
    label: "Data handling and isolation",
    href: `${inAppHelpHref("data-handling")}#isolation`,
    description: "Tenant isolation depth for security reviewers.",
  },
  {
    label: "Contact security diligence",
    href: "mailto:security@archlucid.net",
    description: "NDA-gated materials or alignment on a diligence list.",
  },
] as const;

/** Buyer exits after reading Security and trust help — avoids burying navigation in prose. */
export function SecurityTrustHelpNextSteps(): React.JSX.Element {
  return (
    <section
      aria-labelledby="security-trust-help-next-steps-heading"
      className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950/40"
      data-testid="security-trust-help-next-steps"
    >
      <h2
        id="security-trust-help-next-steps-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Where to go next
      </h2>
      <ul className={cn("m-0 mt-3 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {NEXT_STEPS.map((step) => (
          <li key={step.href}>
            <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={step.href}>
              {step.label}
            </Link>
            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{step.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
