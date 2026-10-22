import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

export type ArchitectureInventoryBindingSnapshotSelection = {
  readonly snapshotId: string | null;
  readonly isValid: boolean;
  readonly showInvalidPasteError: boolean;
};

export function resolveArchitectureInventoryBindingSnapshotId(input: {
  readonly pickerSnapshotId: string;
  readonly pastedSnapshotId: string;
}): ArchitectureInventoryBindingSnapshotSelection {
  const pasted = input.pastedSnapshotId.trim();

  if (pasted.length > 0) {
    return {
      snapshotId: isUuidLike(pasted) ? pasted : null,
      isValid: isUuidLike(pasted),
      showInvalidPasteError: !isUuidLike(pasted),
    };
  }

  const picked = input.pickerSnapshotId.trim();

  if (picked.length > 0 && isUuidLike(picked)) {
    return {
      snapshotId: picked,
      isValid: true,
      showInvalidPasteError: false,
    };
  }

  return {
    snapshotId: null,
    isValid: false,
    showInvalidPasteError: false,
  };
}
