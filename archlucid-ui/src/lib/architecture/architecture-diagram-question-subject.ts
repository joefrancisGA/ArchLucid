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

export const ARCHITECTURE_DIAGRAM_QUESTION_SUBJECT_NOT_FOUND =
  "Question subject was not found on this diagram." as const;

export const ARCHITECTURE_DIAGRAM_QUESTION_SUBJECT_NOT_STORED =
  "Question subject was not stored." as const;

export const ARCHITECTURE_DIAGRAM_QUESTION_SUBJECT_STORED_EMPTY =
  "Question subject was stored empty." as const;

export function inventoryDiagramContainsQuestionSubject(
  svg: SVGSVGElement,
  subjectNodeId: string | null | undefined,
): boolean {
  const trimmed = subjectNodeId?.trim() ?? "";

  if (trimmed.length === 0) {
    return false;
  }

  const focusIds = [trimmed];

  for (const element of queryInventoryDiagramNodeElements(svg)) {
    if (inventoryDiagramNodeElementMatchesFocusId(element, focusIds)) {
      return true;
    }
  }

  return false;
}

/** Highlights only the seed node for an open SecureNow question (not its neighbors). */
export function applySecureNowQuestionSubjectHighlight(
  svg: SVGSVGElement,
  subjectNodeId: string | null | undefined,
): boolean {
  clearSubjectHighlight(svg);

  const trimmed = subjectNodeId?.trim() ?? "";

  if (trimmed.length === 0) {
    return false;
  }

  if (!inventoryDiagramContainsQuestionSubject(svg, trimmed)) {
    return false;
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

  return true;
}
