import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_COMPUTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_DATA,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_IDENTITY,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_NETWORK,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_OTHER,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_STORAGE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";

/** Fills match `DiagramInventoryPictogramKindColors.FillFor`. Do not add a second palette. */
const ACCENT_KINDS = [
  { label: INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_COMPUTE, fill: "#2563eb" },
  { label: INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_NETWORK, fill: "#0f766e" },
  { label: INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_DATA, fill: "#7c3aed" },
  { label: INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_STORAGE, fill: "#d97706" },
  { label: INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_IDENTITY, fill: "#db2777" },
  { label: INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_OTHER, fill: "#475569" },
] as const;

export type InfraEvidenceDiagramAccentKind = (typeof ACCENT_KINDS)[number];

const RECT_TAG = /<rect\b([^>]*?)\/?>/giu;

function readSvgAttribute(attrs: string, name: string): string | null {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "iu");
  const match = pattern.exec(attrs);

  if (!match) {
    return null;
  }

  return match[1] ?? match[2] ?? null;
}

function classListContainsNodeAccent(className: string): boolean {
  return className.split(/\s+/u).includes("node-accent");
}

/** Kinds painted on forest `rect.node-accent` bars, in stable category order. */
export function collectInfraEvidenceDiagramAccentKinds(
  layoutSvg: string | null | undefined,
): readonly InfraEvidenceDiagramAccentKind[] {
  if (!layoutSvg) {
    return [];
  }

  const fills = new Set<string>();

  for (const match of layoutSvg.matchAll(RECT_TAG)) {
    const attrs = match[1] ?? "";
    const className = readSvgAttribute(attrs, "class");

    if (!className || !classListContainsNodeAccent(className)) {
      continue;
    }

    const fill = readSvgAttribute(attrs, "fill");

    if (fill) {
      fills.add(fill.toLowerCase());
    }
  }

  return ACCENT_KINDS.filter((kind) => fills.has(kind.fill));
}
