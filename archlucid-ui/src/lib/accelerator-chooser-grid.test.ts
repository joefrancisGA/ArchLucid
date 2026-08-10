import { describe, expect, it } from "vitest";

import { ACCELERATOR_GREENFIELD_PACK_ID } from "@/lib/accelerator-chooser-pack-prerequisite";
import {
  buildAcceleratorChooserGridItems,
  buildAcceleratorChooserGridItemsForPrerequisite,
} from "@/lib/accelerator-chooser-grid";

describe("accelerator-chooser cost governance grouping", () => {
  it("builds a single grouped grid row for cost governance packs", () => {
    expect(buildAcceleratorChooserGridItems()).toHaveLength(5);
  });

  it("hoists greenfield first when prerequisite is not met", () => {
    const items = buildAcceleratorChooserGridItemsForPrerequisite("not-met");

    expect(items[0]).toEqual({
      kind: "pack",
      entry: expect.objectContaining({ id: ACCELERATOR_GREENFIELD_PACK_ID }),
    });
  });

  it("keeps default order when prerequisite is met", () => {
    const defaultItems = buildAcceleratorChooserGridItems();
    const metItems = buildAcceleratorChooserGridItemsForPrerequisite("met");

    expect(metItems).toEqual(defaultItems);
  });
});
