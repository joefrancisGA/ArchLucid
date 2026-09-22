import { describe, expect, it } from "vitest";

import { resolveArchitectureInventoryBindingSnapshotId } from "@/lib/architecture/architecture-inventory-binding-validation";

describe("resolveArchitectureInventoryBindingSnapshotId (AS-049)", () => {
  it("prefers a valid pasted snapshot id over the picker", () => {
    const result = resolveArchitectureInventoryBindingSnapshotId({
      pickerSnapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      pastedSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });

    expect(result).toEqual({
      snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      isValid: true,
      showInvalidPasteError: false,
    });
  });

  it("uses the picker when paste is empty", () => {
    const result = resolveArchitectureInventoryBindingSnapshotId({
      pickerSnapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      pastedSnapshotId: "   ",
    });

    expect(result.isValid).toBe(true);
    expect(result.snapshotId).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  });

  it("marks invalid paste values for TB-2005 field error", () => {
    const result = resolveArchitectureInventoryBindingSnapshotId({
      pickerSnapshotId: "",
      pastedSnapshotId: "not-a-uuid",
    });

    expect(result.isValid).toBe(false);
    expect(result.showInvalidPasteError).toBe(true);
  });

  it("disables attach when nothing is selected", () => {
    const result = resolveArchitectureInventoryBindingSnapshotId({
      pickerSnapshotId: "",
      pastedSnapshotId: "",
    });

    expect(result).toEqual({
      snapshotId: null,
      isValid: false,
      showInvalidPasteError: false,
    });
  });
});
