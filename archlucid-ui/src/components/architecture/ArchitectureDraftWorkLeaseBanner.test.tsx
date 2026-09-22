import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDraftWorkLeaseBanner } from "@/components/architecture/ArchitectureDraftWorkLeaseBanner";
import {
  ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_TITLE,
  ARCHITECTURE_DRAFT_WORK_LEASE_LOST_TITLE,
  ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_ACTION,
} from "@/lib/architecture/architecture-draft-work-lease-copy";

describe("ArchitectureDraftWorkLeaseBanner (LW-091)", () => {
  it("renders held-by-other copy without live presence language", () => {
    render(
      <ArchitectureDraftWorkLeaseBanner
        heldByOther
        leaseLost={false}
        holderActorOid="platform-user:11111111-1111-1111-1111-111111111111"
        expiresUtc="2026-09-10T12:00:00.000Z"
        stealBusy={false}
        stealError={null}
        onStealLease={vi.fn()}
      />,
    );

    expect(screen.getByText(ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_TITLE)).toBeTruthy();
    expect(screen.getByText(/not live presence/i)).toBeTruthy();
    expect(screen.queryByText(/online/i)).toBeNull();
  });

  it("renders lease-lost state", () => {
    render(
      <ArchitectureDraftWorkLeaseBanner
        heldByOther={false}
        leaseLost
        stealBusy={false}
        stealError={null}
        onStealLease={vi.fn()}
      />,
    );

    expect(screen.getByText(ARCHITECTURE_DRAFT_WORK_LEASE_LOST_TITLE)).toBeTruthy();
  });

  it("confirms steal without a don't-ask-again control", () => {
    const onStealLease = vi.fn();

    render(
      <ArchitectureDraftWorkLeaseBanner
        heldByOther
        leaseLost={false}
        stealBusy={false}
        stealError={null}
        onStealLease={onStealLease}
      />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-work-lease-steal-open"));
    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_ACTION }));

    expect(onStealLease).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText(/don't ask again/i)).toBeNull();
  });
});
