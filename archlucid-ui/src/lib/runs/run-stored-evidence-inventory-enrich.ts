import type { RunDetailEvidenceInventoryKind } from "@/lib/runs/run-detail-evidence-inventory";

export function enrichRunDetailEvidenceInventoryWithCatalog<
  T extends {
    readonly key: string;
    readonly sourceName: string;
    readonly inventoryKind: RunDetailEvidenceInventoryKind;
    readonly evidenceItemId: string | null;
  },
>(
  items: readonly T[],
  catalog: readonly { readonly evidenceItemId: string; readonly originalFileName: string }[],
): readonly T[] {
  if (catalog.length === 0) {
    return items;
  }

  return items.map((item) => {
    if (item.inventoryKind === "architecture-brief") {
      return item;
    }

    const normalizedSource = item.sourceName.trim().toLowerCase();
    const fileNameMatches = catalog.filter(
      (entry) => entry.originalFileName.trim().toLowerCase() === normalizedSource,
    );

    if (fileNameMatches.length === 1) {
      return {
        ...item,
        inventoryKind: "stored-file",
        evidenceItemId: fileNameMatches[0]!.evidenceItemId,
      };
    }

    const idMatches = catalog.filter((entry) => entry.evidenceItemId === item.sourceName.trim());

    if (idMatches.length === 1) {
      return {
        ...item,
        inventoryKind: "stored-file",
        evidenceItemId: idMatches[0]!.evidenceItemId,
      };
    }

    return item;
  });
}
