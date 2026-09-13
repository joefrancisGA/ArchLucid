import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { formatInhabitFindingDispositionConflictMessage } from "@/lib/inhabit/inhabit-409-conflict-copy";
import { sortInhabitFindingsPaletteHandlerActions } from "@/lib/inhabit/inhabit-palette-findings-rank";
import type { CommandPaletteHandlerActionId } from "@/lib/command-palette-handler-actions";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit room guard (IH-053–058)", () => {
  it("IH-053 mounts inhabited room card on findings chrome", () => {
    const chrome = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsDocumentChrome.tsx"),
      "utf8",
    );

    expect(chrome).toContain("InhabitedFindingsRoomCard");
  });

  it("IH-054 room card uses architecture identity header presentation", () => {
    const roomCard = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsRoomCard.tsx"),
      "utf8",
    );

    expect(roomCard).toContain("resolveInhabitRoomCardHeaderPresentation");
  });

  it("IH-057 mounts spawn-locked lease honesty on findings", () => {
    const chrome = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsDocumentChrome.tsx"),
      "utf8",
    );

    expect(chrome).toContain("InhabitedFindingsWorkLeaseHonesty");
  });

  it("IH-058 409 copy avoids presence language", () => {
    const message = formatInhabitFindingDispositionConflictMessage({
      eventId: "e1",
      findingId: "f1",
      disposition: "Accepted",
      reviewerUserId: "u2",
      occurredAtUtc: "2026-09-13T12:00:00Z",
      currentDispositionRowVersionBase64: "v1",
    });

    expect(message.toLowerCase()).toContain("conflict");
    expect(message.toLowerCase()).not.toContain("presence");
    expect(message.toLowerCase()).not.toContain("cursor");
  });

  it("IH-056 working share href prefers architecture locator", () => {
    const share = readFileSync(join(SRC_ROOT, "lib/architecture/working-share-href.ts"), "utf8");

    expect(share).toContain("architectureIdentityPath");
  });
});

describe("inhabit keyboard guard (IH-059–062)", () => {
  it("IH-059 mounts focus coordinator on inhabited findings results", () => {
    const results = readFileSync(
      join(SRC_ROOT, "app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx"),
      "utf8",
    );

    expect(results).toContain("InhabitedFindingsFocusCoordinator");
  });

  it("IH-060 ranks finding accept before finalize in palette sort", () => {
    const sorted = sortInhabitFindingsPaletteHandlerActions([
      { id: "action-finalize-review" as CommandPaletteHandlerActionId },
      { id: "action-finding-accept" as CommandPaletteHandlerActionId },
    ]);

    expect(sorted[0]?.id).toBe("action-finding-accept");
  });

  it("IH-062 nested findings page does not mount welcome modal", () => {
    const nestedFindings = readFileSync(
      join(
        SRC_ROOT,
        "app/(operator)/architecture/architectures/[architectureId]/findings/ArchitectureNestedFindingsPageClient.tsx",
      ),
      "utf8",
    );

    expect(nestedFindings.toLowerCase()).not.toContain("welcomemodal");
    expect(nestedFindings.toLowerCase()).not.toContain("first-run");
  });
});
