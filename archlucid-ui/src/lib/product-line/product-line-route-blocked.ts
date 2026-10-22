import { navHrefPathPart } from "@/lib/nav-href-path-part";
import type { ProductLineAssignment } from "@/lib/product-line/product-line-assignment";
import { productLineAssignmentIncludes } from "@/lib/product-line/product-line-assignment";
import { PRODUCT_LINE_LABELS } from "@/lib/product-line/product-line-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { resolveProductLineAssignmentForPath } from "@/lib/product-line/product-line-path-access";

export type ProductLineRouteBlockedPresentation = {
  readonly blockedPath: string;
  readonly activeProductLine: ProductLineId;
  readonly activeProductLabel: string;
  readonly requiredAssignment: ProductLineAssignment;
  readonly reasonSentence: string;
  readonly switchToProductLine: ProductLineId | null;
  readonly switchToProductLabel: string | null;
};

function requiredProductLineForAssignment(
  assignment: ProductLineAssignment,
  activeProductLine: ProductLineId,
): ProductLineId | null {
  if (assignment === "both") {
    return null;
  }

  if (productLineAssignmentIncludes(assignment, activeProductLine)) {
    return null;
  }

  return assignment;
}

export function resolveProductLineRouteBlockedPresentation(input: {
  readonly pathname: string;
  readonly activeProductLine: ProductLineId;
  readonly assignmentOverrides?: Readonly<Record<string, ProductLineAssignment>>;
}): ProductLineRouteBlockedPresentation {
  const blockedPath = navHrefPathPart(input.pathname);
  const requiredAssignment = resolveProductLineAssignmentForPath(
    blockedPath,
    input.assignmentOverrides,
  );
  const switchToProductLine = requiredProductLineForAssignment(
    requiredAssignment,
    input.activeProductLine,
  );
  const activeProductLabel = PRODUCT_LINE_LABELS[input.activeProductLine];

  const reasonSentence =
    switchToProductLine === null
      ? `This destination is not available in the ${activeProductLabel} product shell.`
      : requiredAssignment === "security"
        ? `This destination is part of the ${PRODUCT_LINE_LABELS.security} product shell — not ${activeProductLabel}.`
        : `This destination is part of the ${PRODUCT_LINE_LABELS.architecture} product shell — not ${activeProductLabel}.`;

  return {
    blockedPath,
    activeProductLine: input.activeProductLine,
    activeProductLabel,
    requiredAssignment,
    reasonSentence,
    switchToProductLine,
    switchToProductLabel:
      switchToProductLine === null ? null : PRODUCT_LINE_LABELS[switchToProductLine],
  };
}
