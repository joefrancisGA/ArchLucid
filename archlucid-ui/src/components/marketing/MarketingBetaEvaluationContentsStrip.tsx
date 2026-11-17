import Link from "next/link";

import { cn } from "@/lib/utils";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHLUCID_BETA_EVALUATION_CONTENTS_EXCLUDES,
  ARCHLUCID_BETA_EVALUATION_CONTENTS_HEADING,
  ARCHLUCID_BETA_EVALUATION_CONTENTS_INCLUDES,
  ARCHLUCID_BETA_EVALUATION_CONTENTS_LEAD,
  ARCHLUCID_BETA_EVALUATION_QUOTE_HREF,
  ARCHLUCID_BETA_EVALUATION_QUOTE_LABEL,
} from "@/lib/marketing/archlucid-beta-evaluation-contents-copy";

export function MarketingBetaEvaluationContentsStrip(): React.JSX.Element {
  return (
    <div
      className="mb-8 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="marketing-beta-evaluation-contents-strip"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
        {ARCHLUCID_BETA_EVALUATION_CONTENTS_HEADING}
      </p>
      <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
        {ARCHLUCID_BETA_EVALUATION_CONTENTS_LEAD}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className={cn("m-0 font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.meta)}>Includes</p>
          <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", MARKETING_TYPOGRAPHY.body)}>
            {ARCHLUCID_BETA_EVALUATION_CONTENTS_INCLUDES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className={cn("m-0 font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.meta)}>Does not include</p>
          <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", MARKETING_TYPOGRAPHY.body)}>
            {ARCHLUCID_BETA_EVALUATION_CONTENTS_EXCLUDES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className={cn("m-0 mt-4", MARKETING_TYPOGRAPHY.body)}>
        <Link className="font-medium text-al-primary-action underline-offset-2 hover:underline" href={ARCHLUCID_BETA_EVALUATION_QUOTE_HREF}>
          {ARCHLUCID_BETA_EVALUATION_QUOTE_LABEL}
        </Link>
      </p>
    </div>
  );
}
