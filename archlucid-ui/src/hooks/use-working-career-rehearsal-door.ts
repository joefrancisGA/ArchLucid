"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  extractArchitectureIdentityIdFromPathname,
  readCachedLastOpenArchitectureId,
} from "@/lib/desk-continuity-preference";
import {
  readWorkingCareerRehearsalDoorFromStorage,
  resolveWorkingCareerRehearsalDoorScope,
  writeWorkingCareerRehearsalDoorToStorage,
  type WorkingCareerRehearsalDoorId,
  type WorkingCareerRehearsalDoorScope,
} from "@/lib/governance/working-career-rehearsal-door";
import {
  persistWorkingCareerRehearsalDoorToServer,
  syncWorkingCareerRehearsalDoorFromServer,
} from "@/lib/governance/working-career-rehearsal-door-preference";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

export type UseWorkingCareerRehearsalDoorResult = {
  readonly door: WorkingCareerRehearsalDoorId;
  readonly mounted: boolean;
  readonly setDoor: (door: WorkingCareerRehearsalDoorId) => void;
};

function resolveArchitectureIdForDoor(pathname: string, search: string): string | null {
  const fromRoute = extractArchitectureIdentityIdFromPathname(pathname, search);

  if (fromRoute !== null) {
    return fromRoute;
  }

  return readCachedLastOpenArchitectureId();
}

function writeInterruptRecoveryDoor(
  scope: WorkingCareerRehearsalDoorScope,
  door: WorkingCareerRehearsalDoorId,
): void {
  writeWorkingCareerRehearsalDoorToStorage(scope, door);
  writeWorkingCareerRehearsalDoorToStorage({ kind: "tenant" }, door);
}

/** Working Career vs Rehearsal door: server first, localStorage interrupt recovery only (CG-011). */
export function useWorkingCareerRehearsalDoor(): UseWorkingCareerRehearsalDoorResult {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const architectureId = useMemo(
    () => resolveArchitectureIdForDoor(pathname, search),
    [pathname, search],
  );
  const scope = useMemo(
    () => resolveWorkingCareerRehearsalDoorScope({ architectureId }),
    [architectureId],
  );
  const { mode } = useWorkspaceMode();
  const isWorking = isWorkingWorkspaceMode(mode);
  const [mounted, setMounted] = useState(false);
  const [door, setDoorState] = useState<WorkingCareerRehearsalDoorId>(() =>
    readWorkingCareerRehearsalDoorFromStorage(scope),
  );

  useEffect(() => {
    setMounted(true);
    setDoorState(readWorkingCareerRehearsalDoorFromStorage(scope));

    if (!isWorking) {
      return;
    }

    void syncWorkingCareerRehearsalDoorFromServer(scope).then((synced) => {
      if (synced === null) {
        return;
      }

      setDoorState(synced);
    });
  }, [isWorking, scope]);

  const setDoor = useCallback(
    (next: WorkingCareerRehearsalDoorId) => {
      writeInterruptRecoveryDoor(scope, next);
      setDoorState(next);

      if (!isWorking) {
        return;
      }

      void persistWorkingCareerRehearsalDoorToServer(next);
    },
    [isWorking, scope],
  );

  return {
    door,
    mounted,
    setDoor,
  };
}
