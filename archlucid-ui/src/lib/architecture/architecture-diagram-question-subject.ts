import { inventoryDiagramNodeElementMatchesFocusId } from "@/lib/architecture/architecture-diagram-camera-focus";
import { queryInventoryDiagramNodeElements } from "@/lib/help/help-mermaid";

const SUBJECT_ATTRIBUTE = "data-securenow-question-subject";
const SUBJECT_STROKE = "var(--al-accent-border-focus)";
const SUBJECT_STROKE_WIDTH = "3";

function clearSubjectHighlight(svg: SVGSVGElement): void {
  for (const element of queryInventoryDiagramNodeElements(svg)) {
    element.removeAttribute(SUBJECT_ATTRIBUTE);

    const rect = element.querySelector("rect");

    if (rect === null) {
      continue;
    }

    rect.removeAttribute("data-securenow-question-subject-stroke");
    rect.style.removeProperty("stroke");
    rect.style.removeProperty("stroke-width");
  }
}

/** Highlights only the seed node for an open SecureNow question (not its neighbors). */
export function applySecureNowQuestionSubjectHighlight(
  svg: SVGSVGElement,
  subjectNodeId: string | null | undefined,
): void {
  clearSubjectHighlight(svg);

  const trimmed = subjectNodeId?.trim() ?? "";

  if (trimmed.length === 0) {
    return;
  }

  const focusIds = [trimmed];

  for (const element of queryInventoryDiagramNodeElements(svg)) {
    if (!inventoryDiagramNodeElementMatchesFocusId(element, focusIds)) {
      continue;
    }

    element.setAttribute(SUBJECT_ATTRIBUTE, "true");

    const rect = element.querySelector("rect");

    if (rect === null) {
      continue;
    }

    rect.setAttribute("data-securenow-question-subject-stroke", "true");
    rect.style.stroke = SUBJECT_STROKE;
    rect.style.strokeWidth = SUBJECT_STROKE_WIDTH;
  }
}
