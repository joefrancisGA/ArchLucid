"use client";

import { useWorkingCareerDoorGate } from "@/hooks/use-working-career-door-gate";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import { resolveEffectiveWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-door-gate";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

export type UseEffectiveWorkingCareerRehearsalDoorResult = {
  readonly door: WorkingCareerRehearsalDoorId;
  readonly effectiveDoor: WorkingCareerRehearsalDoorId;
  readonly mounted: boolean;
};

/** Selected Working door plus AS-078 gate resolution for execute/posture surfaces (AS-079). */
export function useEffectiveWorkingCareerRehearsalDoor(): UseEffectiveWorkingCareerRehearsalDoorResult {
  const { door, mounted } = useWorkingCareerRehearsalDoor();
  const gate = useWorkingCareerDoorGate(door);

  return {
    door,
    effectiveDoor: resolveEffectiveWorkingCareerRehearsalDoor(door, gate),
    mounted,
  };
}
