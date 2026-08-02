import { cn } from "@/lib/utils";

import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  MARKETING_PRICING_FIT_MATRIX,
  type MarketingPricingFitRow,
} from "@/lib/marketing/marketing-pricing-tier-display";
import {
  MARKETING_PRICING_TIER_ORDER,
  type MarketingPricingTierId,
} from "@/lib/marketing/marketing-public-pricing";

const FIT_MATRIX_TIER_LABELS: Readonly<Record<MarketingPricingTierId, string>> = {
  architect: "Architect",
  team: "Team",
  professional: "Professional",
  enterprise: "Enterprise",
};

function FitMatrixCell(props: { readonly included: boolean; readonly tierLabel: string; readonly rowLabel: string }): React.JSX.Element {
  const cellLabel = props.included ? `${props.rowLabel} — ${props.tierLabel}` : undefined;

  return (
    <td className="px-3 py-2 text-center align-middle" aria-label={cellLabel}>
      <span
        aria-hidden
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold",
          props.included
            ? "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200"
            : "text-neutral-300 dark:text-neutral-700",
        )}
      >
        {props.included ? "✓" : "—"}
      </span>
    </td>
  );
}

function FitMatrixRow(props: { readonly row: MarketingPricingFitRow }): React.JSX.Element {
  return (
    <tr className="border-t border-neutral-200 dark:border-neutral-800">
      <th scope="row" className={cn("px-3 py-2 text-left font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>
        {props.row.label}
      </th>
      {MARKETING_PRICING_TIER_ORDER.map((tierId) => (
        <FitMatrixCell
          key={tierId}
          included={props.row.tiers[tierId]}
          rowLabel={props.row.label}
          tierLabel={FIT_MATRIX_TIER_LABELS[tierId]}
        />
      ))}
    </tr>
  );
}

/** Persona fit row under the tier grid — buyers scan fit before feature depth. */
export function MarketingPricingFitMatrix(): React.JSX.Element {
  return (
    <div
      className="mt-8 overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      data-testid="pricing-fit-matrix"
    >
      <table className="min-w-full border-collapse">
        <caption className={cn("px-4 py-3 text-left font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          Which plan fits your team?
        </caption>
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60">
            <th scope="col" className="px-3 py-2 text-left">
              <span className="sr-only">Team profile</span>
            </th>
            {MARKETING_PRICING_TIER_ORDER.map((tierId) => (
              <th
                key={tierId}
                scope="col"
                className={cn("px-3 py-2 text-center font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.helper)}
              >
                {FIT_MATRIX_TIER_LABELS[tierId]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MARKETING_PRICING_FIT_MATRIX.map((row) => (
            <FitMatrixRow key={row.label} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
