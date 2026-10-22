import { render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InfraDiagramsSnapshotPickerOptions } from "./InfraDiagramsSnapshotPickerOptions";

describe("InfraDiagramsSnapshotPickerOptions", () => {
  it("shows loading placeholder while snapshots are loading", () => {
    const { container } = render(
      <InfraDiagramsSnapshotPickerOptions
        loadingSnapshots={true}
        diagramsSubscriptionChosen={false}
        snapshotsEmpty={false}
        visibleSnapshots={[]}
        selectedSnapshotId=""
        selectedSnapshotVisibleInSubscriptionFilter={false}
        formatSnapshotPickerLabel={vi.fn()}
      />,
    );

    expect(within(container).getByText("Loading snapshots…")).toBeInTheDocument();
  });
});
