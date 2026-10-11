import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import {
  hasInfraEvidenceDeclaredDiagramEdges,
  hasInfraEvidenceInferredDiagramEdges,
  hasInfraEvidenceProbableDiagramEdges,
  type InfraEvidenceMermaidOutline,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { resolveInfraEvidenceCompletenessWarningPresentation } from "@/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy";

export type InfraEvidencePngReadingStripInput = {
  readonly mode: string | null | undefined;
  readonly outline: InfraEvidenceMermaidOutline | null | undefined;
  readonly completenessWarnings: readonly string[];
};

function hasObservedEdges(outline: InfraEvidenceMermaidOutline | null | undefined): boolean {
  return outline?.edges.some((edge) => edge.source === "observed") === true;
}

export function buildInfraEvidencePngReadingStripLines(
  input: InfraEvidencePngReadingStripInput,
): readonly string[] {
  const lines: string[] = [];
  const mode = input.mode?.trim() ?? "";

  if (mode === "dataFlow") {
    lines.push("This diagram shows what may connect. It is not observed traffic.");
  } else if (mode === "dataArchitecture") {
    lines.push("This diagram shows what stores data.");
  }

  if (hasObservedEdges(input.outline)) {
    lines.push(INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED);
  }

  if (hasInfraEvidenceDeclaredDiagramEdges(input.outline ?? null)) {
    lines.push(INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED);
  }

  if (hasInfraEvidenceProbableDiagramEdges(input.outline ?? null)) {
    lines.push(INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE);
  }

  if (hasInfraEvidenceInferredDiagramEdges(input.outline ?? null)) {
    lines.push(INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED);
  }

  if (input.completenessWarnings.length > 0) {
    lines.push(
      `Inventory completeness warnings (${input.completenessWarnings.length}). Connection lines may be missing.`,
    );

    const warningTitles = input.completenessWarnings
      .slice(0, 3)
      .map((warning) => resolveInfraEvidenceCompletenessWarningPresentation(warning).title);

    lines.push(...warningTitles.map((title) => `Warning: ${title}`));

    if (input.completenessWarnings.length > warningTitles.length) {
      lines.push(`Warning: and ${input.completenessWarnings.length - warningTitles.length} more.`);
    }
  }

  return lines;
}

export async function appendInfraEvidencePngReadingStrip(
  blob: Blob,
  lines: readonly string[],
): Promise<Blob> {
  if (lines.length === 0) {
    return blob;
  }

  const bitmap = await createImageBitmap(blob);
  const footerHeight = Math.max(64, 28 + lines.length * 24);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height + footerHeight;

  const context = canvas.getContext("2d");

  if (context === null) {
    bitmap.close();
    return blob;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  context.fillStyle = "#111827";
  context.font = "16px sans-serif";
  lines.forEach((line, index) => {
    context.fillText(line, 16, bitmap.height + 28 + index * 24);
  });
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result === null) {
        reject(new Error("PNG reading strip could not be encoded."));
        return;
      }

      resolve(result);
    }, "image/png");
  });
}
