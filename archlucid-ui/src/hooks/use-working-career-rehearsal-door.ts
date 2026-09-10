"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  readWorkingCareerRehearsalDoorFromStorage,
  resolveWorkingCareerRehearsalDoorScope,
  writeWorkingCareerRehearsalDoorToStorage,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";
import {
  extractArchitectureIdentityIdFromPathname,
  readCachedLastOpenArchitectureId,
} from "@/lib/desk-continuity-preference";
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

/** Working Career vs Rehearsal door state with architecture-first persistence (AS-077). */
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
  const [mounted, setMounted] = useState(false);
  const [door, setDoorState] = useState<WorkingCareerRehearsalDoorId>(() =>
    readWorkingCareerRehearsalDoorFromStorage(scope),
  );

  useEffect(() => {
    setMounted(true);
    setDoorState(readWorkingCareerRehearsalDoorFromStorage(scope));
  }, [scope]);

  const setDoor = useCallback(
    (next: WorkingCareerRehearsalDoorId) => {
      writeWorkingCareerRehearsalDoorToStorage(scope, next);
      setDoorState(next);
    },
    [scope],
  );

  return {
    door,
    mounted,
    setDoor,
  };
}
