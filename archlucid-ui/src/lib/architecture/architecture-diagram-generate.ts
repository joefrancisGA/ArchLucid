import type { ArchitectureCreationUserAssertions, ArchitectureStructuredParseResult } from "@/lib/architecture/architecture-structured-content-types";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import { applyArchitectureDiagramOverrides, buildArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-model";
import {
  architectureDiagramModelToMermaid,
  architectureDiagramModelToTextAlternative,
} from "@/lib/architecture/architecture-diagram-mermaid";
import { assessArchitectureDiagramReadiness } from "@/lib/architecture/architecture-diagram-readiness";
import type { ArchitectureDiagramGenerationResult } from "@/lib/architecture/architecture-diagram-types";

export function buildArchitectureDiagramContentFingerprint(
  parseResult: ArchitectureStructuredParseResult,
  architectureName: string,
): string {
  const sectionDigest = parseResult.sections
    .map((section) => `${section.key}:${section.narrativeMarkdown ?? ""}:${section.entities.map((entity) => entity.label).join(",")}`)
    .join("|");

  return `${architectureName.trim()}::${sectionDigest}::${parseResult.sourceText.length}`;
}

export function generateArchitectureDiagram(
  sourceText: string,
  architectureName: string,
  userAssertions: ArchitectureCreationUserAssertions | null,
  nodeOverrides: Parameters<typeof applyArchitectureDiagramOverrides>[1] = [],
  edgeOverrides: Parameters<typeof applyArchitectureDiagramOverrides>[2] = [],
): ArchitectureDiagramGenerationResult {
  const parseResult = parseArchitectureGeneratedContent(sourceText, userAssertions);
  const readiness = assessArchitectureDiagramReadiness(parseResult, architectureName);
  const contentFingerprint = buildArchitectureDiagramContentFingerprint(parseResult, architectureName);

  if (!readiness.sufficient) {
    return {
      readiness,
      model: null,
      mermaidSource: null,
      textAlternative: "",
      contentFingerprint,
    };
  }

  const baseModel = buildArchitectureDiagramModel(parseResult, architectureName);
  const model = applyArchitectureDiagramOverrides(baseModel, nodeOverrides, edgeOverrides);
  const mermaidSource = architectureDiagramModelToMermaid(model);
  const textAlternative = architectureDiagramModelToTextAlternative(model);

  return {
    readiness,
    model,
    mermaidSource,
    textAlternative,
    contentFingerprint,
  };
}

/** Yields once so diagram generation can present a loading state without blocking the UI thread. */
export async function generateArchitectureDiagramAsync(
  sourceText: string,
  architectureName: string,
  userAssertions: ArchitectureCreationUserAssertions | null,
  nodeOverrides: Parameters<typeof applyArchitectureDiagramOverrides>[1] = [],
  edgeOverrides: Parameters<typeof applyArchitectureDiagramOverrides>[2] = [],
): Promise<ArchitectureDiagramGenerationResult> {
  await new Promise<void>((resolve) => {
    if (typeof window !== "undefined") {
      window.setTimeout(resolve, 0);
    } else {
      resolve();
    }
  });

  return generateArchitectureDiagram(sourceText, architectureName, userAssertions, nodeOverrides, edgeOverrides);
}
