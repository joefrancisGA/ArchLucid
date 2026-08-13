import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SpecialtyReviewTemplateDefinition } from "@/lib/specialty-review-templates";

export type SpecialtyTemplateComparisonTableProps = {
  readonly templates: readonly SpecialtyReviewTemplateDefinition[];
};

type ComparisonRow = {
  readonly label: string;
  readonly renderCell: (template: SpecialtyReviewTemplateDefinition) => React.ReactNode;
};

const COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    label: "Best for",
    renderCell: (template) => template.bestFor,
  },
  {
    label: "Focus areas",
    renderCell: (template) => template.focusAreas.join(", "),
  },
  {
    label: "Policy packs",
    renderCell: (template) => (
      <ul className="m-0 list-none space-y-1 p-0">
        {template.policyPacks.map((pack) => (
          <li key={pack.id}>
            <Link href={pack.href} className={cn(OPERATOR_LINK.inline)}>
              {pack.label} v{pack.version}
            </Link>
          </li>
        ))}
      </ul>
    ),
  },
  {
    label: "Expected outcome",
    renderCell: (template) => template.expectedOutput,
  },
];

/** Side-by-side comparison of specialty review templates. */
export function SpecialtyTemplateComparisonTable(
  props: SpecialtyTemplateComparisonTableProps,
): React.ReactElement {
  return (
    <div className="overflow-x-auto" data-testid="specialty-template-comparison-table">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <caption className="sr-only">Specialty review template comparison</caption>
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <th scope="col" className={cn("p-3 pr-4", OPERATOR_TYPOGRAPHY.helper)}>
              Compare
            </th>
            {props.templates.map((template) => (
              <th
                key={template.id}
                scope="col"
                className={cn("p-3", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                {template.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.label} className="border-b border-neutral-100 dark:border-neutral-800/80">
              <th scope="row" className={cn("p-3 pr-4 align-top", OPERATOR_TYPOGRAPHY.helper, "font-semibold")}>
                {row.label}
              </th>
              {props.templates.map((template) => (
                <td key={`${row.label}-${template.id}`} className={cn("p-3 align-top", OPERATOR_TYPOGRAPHY.body)}>
                  {row.renderCell(template)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
