import { SESSION_IDLE_BROADCAST_CHANNEL } from "@/lib/auth/session-idle-timeout";
import {
  parseWorkingCareerRehearsalDoorId,
  WORKING_CAREER_REHEARSAL_DOOR_IDS,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";

/**
 * CG-012 — same operator bus as LW-083 (`archlucid.session.idle`). Do not open a second
 * BroadcastChannel. Payload is the door id only (no tokens, no draft CAS).
 */
export const WORKING_CAREER_REHEARSAL_DOOR_BROADCAST_TYPE = "working-career-rehearsal-door" as const;

export type WorkingCareerRehearsalDoorBroadcastMessage = {
  readonly type: typeof WORKING_CAREER_REHEARSAL_DOOR_BROADCAST_TYPE;
  readonly door: WorkingCareerRehearsalDoorId;
};

export function isWorkingCareerRehearsalDoorBroadcastMessage(
  value: unknown,
): value is WorkingCareerRehearsalDoorBroadcastMessage {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const record = value as { readonly type?: unknown; readonly door?: unknown };

  if (record.type !== WORKING_CAREER_REHEARSAL_DOOR_BROADCAST_TYPE) {
    return false;
  }

  return WORKING_CAREER_REHEARSAL_DOOR_IDS.some((door) => door === record.door);
}

export function postWorkingCareerRehearsalDoorBroadcast(door: WorkingCareerRehearsalDoorId): void {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(SESSION_IDLE_BROADCAST_CHANNEL);
  const message: WorkingCareerRehearsalDoorBroadcastMessage = {
    type: WORKING_CAREER_REHEARSAL_DOOR_BROADCAST_TYPE,
    door,
  };

  channel.postMessage(message);
  channel.close();
}

export function subscribeWorkingCareerRehearsalDoorBroadcast(
  listener: (door: WorkingCareerRehearsalDoorId) => void,
): () => void {
  if (typeof BroadcastChannel === "undefined") {
    return () => undefined;
  }

  const channel = new BroadcastChannel(SESSION_IDLE_BROADCAST_CHANNEL);

  const onMessage = (event: MessageEvent<unknown>) => {
    if (!isWorkingCareerRehearsalDoorBroadcastMessage(event.data)) {
      return;
    }

    listener(parseWorkingCareerRehearsalDoorId(event.data.door));
  };

  channel.addEventListener("message", onMessage);

  return () => {
    channel.removeEventListener("message", onMessage);
    channel.close();
  };
}
