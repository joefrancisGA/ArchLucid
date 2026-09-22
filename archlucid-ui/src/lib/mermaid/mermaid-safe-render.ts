import { sanitizeMermaidRenderId, removeMermaidRenderBindElement } from "@/lib/help/help-mermaid";
import { stripInlineMermaidFlowchartComments } from "@/lib/mermaid/strip-inline-mermaid-flowchart-comments";

export type MermaidSafeRenderApi = {
  initialize: (config: object) => void;
  render: (id: string, text: string) => Promise<{ svg: string }>;
};

export type RenderMermaidSvgMarkupOptions = {
  readonly renderIdBase: string;
  readonly initialize: (mermaid: MermaidSafeRenderApi) => void;
};

let mermaidRenderTail: Promise<void> = Promise.resolve();
let mermaidRenderSequence = 0;

export function allocateMermaidRenderId(renderIdBase: string): string {
  mermaidRenderSequence += 1;

  const sanitizedBase = sanitizeMermaidRenderId(renderIdBase);

  if (sanitizedBase.length === 0) {
    return sanitizeMermaidRenderId(`mermaid-${mermaidRenderSequence}`);
  }

  return sanitizeMermaidRenderId(`${sanitizedBase}-${mermaidRenderSequence}`);
}

export function resetMermaidSafeRenderQueue(): void {
  mermaidRenderTail = Promise.resolve();
  mermaidRenderSequence = 0;
}

/**
 * Serializes mermaid.render onto a unique id.
 * Overlapping calls that share one id delete Mermaid's scratch `#d{id}` node
 * mid-render, which throws "Cannot read properties of null (reading 'firstChild')".
 */
export async function renderMermaidSvgMarkup(
  source: string,
  options: RenderMermaidSvgMarkupOptions,
): Promise<string> {
  const renderId = allocateMermaidRenderId(options.renderIdBase);
  const preparedSource = stripInlineMermaidFlowchartComments(source.trim());

  const run = mermaidRenderTail.then(async () => {
    try {
      const mermaidModule = await import("mermaid");
      const mermaid = mermaidModule.default as MermaidSafeRenderApi;

      options.initialize(mermaid);

      const result = await mermaid.render(renderId, preparedSource);

      if (result == null || typeof result.svg !== "string" || result.svg.trim().length === 0) {
        throw new Error("Mermaid render returned no SVG.");
      }

      return result.svg;
    } finally {
      removeMermaidRenderBindElement(renderId);
    }
  });

  mermaidRenderTail = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}
