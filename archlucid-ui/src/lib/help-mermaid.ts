const MERMAID_DIAGRAM_START =
  /^(?:flowchart|graph\s+(?:TD|TB|BT|RL|LR|DT|DR)|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie\s|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i;

/** True when a fenced block should render as a Mermaid diagram instead of monospace source. */
export function isMermaidDiagramSource(code: string, language?: string): boolean {
  const lang = (language ?? "").trim().toLowerCase();

  if (lang === "mermaid" || lang === "mmd") {
    return true;
  }

  return MERMAID_DIAGRAM_START.test(code.trimStart());
}

/** Stable render ids for Mermaid — strips characters that break DOM id rules. */
export function sanitizeMermaidRenderId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9_-]/g, "");
}
