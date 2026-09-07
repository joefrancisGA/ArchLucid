"use client";

import { flattenNavLinks } from "@/lib/nav-config";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  PRODUCT_LINE_ASSIGNMENTS,
  type ProductLineAssignment,
} from "@/lib/product-line/product-line-assignment";
import { PRODUCT_LINE_IDS } from "@/lib/product-line/product-line-id";
import {
  PRODUCT_LINE_LABELS,
  PRODUCT_LINE_PLAYGROUND_SUBTITLE,
  PRODUCT_LINE_PLAYGROUND_TITLE,
} from "@/lib/product-line/product-line-copy";
import { resolveProductLineAssignmentForPath } from "@/lib/product-line/product-line-path-access";

function catalogDefaultForHref(href: string): ProductLineAssignment {
  return resolveProductLineAssignmentForPath(href);
}

export function ProductLinePlaygroundClient(): React.JSX.Element {
  const {
    productLine,
    assignmentOverrides,
    setProductLine,
    setHrefAssignment,
    resetHrefAssignment,
    resetAllAssignments,
  } = useProductLine();
  const links = flattenNavLinks();

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="product-line-playground">
      <OperatorPageHeader
        title={PRODUCT_LINE_PLAYGROUND_TITLE}
        subtitle={PRODUCT_LINE_PLAYGROUND_SUBTITLE}
        headingLevel="h2"
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Active product shell">
        {PRODUCT_LINE_IDS.map((id) => {
          const selected = productLine === id;

          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              aria-pressed={selected}
              data-testid={`product-line-option-${id}`}
              onClick={() => {
                setProductLine(id);
              }}
            >
              {PRODUCT_LINE_LABELS[id]}
            </Button>
          );
        })}
      </div>

      <Button type="button" size="sm" variant="outline" onClick={() => resetAllAssignments()}>
        Reset href assignments
      </Button>

      <table className="w-full border-collapse text-left" data-testid="product-line-assignment-table">
        <thead>
          <tr>
            <th className={OPERATOR_TYPOGRAPHY.helper} scope="col">
              Destination
            </th>
            <th className={OPERATOR_TYPOGRAPHY.helper} scope="col">
              Catalog default
            </th>
            <th className={OPERATOR_TYPOGRAPHY.helper} scope="col">
              Assignment
            </th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => {
            const catalogDefault = catalogDefaultForHref(link.href);
            const effective = resolveProductLineAssignmentForPath(link.href, assignmentOverrides);
            const override = assignmentOverrides[link.href];

            return (
              <tr key={link.href}>
                <td className={OPERATOR_TYPOGRAPHY.body}>
                  {link.label}
                  <span className={OPERATOR_TYPOGRAPHY.helper}> {link.href}</span>
                </td>
                <td className={OPERATOR_TYPOGRAPHY.helper}>{catalogDefault}</td>
                <td>
                  <select
                    aria-label={`Assignment for ${link.label}`}
                    className="rounded-md border border-neutral-300 bg-white px-2 py-1"
                    value={effective}
                    onChange={(event) => {
                      const next = event.target.value as ProductLineAssignment;

                      if (next === catalogDefault) {
                        resetHrefAssignment(link.href);

                        return;
                      }

                      setHrefAssignment(link.href, next);
                    }}
                  >
                    {PRODUCT_LINE_ASSIGNMENTS.map((assignment) => (
                      <option key={assignment} value={assignment}>
                        {assignment}
                        {override === assignment ? " (override)" : ""}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </OperatorPageContainer>
  );
}
