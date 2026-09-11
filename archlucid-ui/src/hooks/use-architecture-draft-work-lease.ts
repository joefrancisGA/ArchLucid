"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  heartbeatDraftWorkLease,
  readDraftWorkLeaseHeartbeatLost,
  releaseDraftWorkLease,
  stealDraftWorkLease,
  tryAcquireDraftWorkLease,
} from "@/lib/api/draft-intake-api";
import { SESSION_IDLE_FOCUS_HEARTBEAT_MS } from "@/lib/auth/session-idle-timeout";
import type { ArchitectureWorkLeaseSnapshot } from "@/types/draft-intake-work-lease";
import type { DraftRequestResponse } from "@/types/draft-intake";

function isMutableDraftLeaseTarget(draft: DraftRequestResponse | null): boolean {
  return draft?.status === "Drafting" || draft?.status === "Admitted";
}

function snapshotFromDraft(draft: DraftRequestResponse | null): ArchitectureWorkLeaseSnapshot | null {
  return draft?.workLease ?? null;
}

export type UseArchitectureDraftWorkLeaseResult = {
  readonly lease: ArchitectureWorkLeaseSnapshot | null;
  readonly leaseLost: boolean;
  readonly heldByOther: boolean;
  readonly stealBusy: boolean;
  readonly stealError: string | null;
  readonly stealLease: () => Promise<void>;
};

/** Acquires, heartbeats, and releases draft work leases on the architecture desk only (LW-091). */
export function useArchitectureDraftWorkLease(
  draftId: string | null,
  draft: DraftRequestResponse | null,
  enabled: boolean,
): UseArchitectureDraftWorkLeaseResult {
  const [lease, setLease] = useState<ArchitectureWorkLeaseSnapshot | null>(() => snapshotFromDraft(draft));
  const [leaseLost, setLeaseLost] = useState(false);
  const [stealBusy, setStealBusy] = useState(false);
  const [stealError, setStealError] = useState<string | null>(null);
  const acquireStartedRef = useRef(false);

  useEffect(() => {
    setLease(snapshotFromDraft(draft));
  }, [draft?.workLease?.holderUserId, draft?.workLease?.expiresUtc, draft?.workLease?.heldByCaller]);

  const mutable = enabled && draftId !== null && isMutableDraftLeaseTarget(draft);

  useEffect(() => {
    if (!mutable || draftId === null || acquireStartedRef.current) {
      return;
    }

    acquireStartedRef.current = true;

    void (async () => {
      const outcome = await tryAcquireDraftWorkLease(draftId);

      if (outcome.kind === "acquired") {
        setLease(outcome.lease);
        setLeaseLost(false);

        return;
      }

      if (outcome.kind === "held-by-other") {
        setLease({
          holderUserId: outcome.conflict.holderUserId,
          holderActorOid: outcome.conflict.holderActorOid,
          expiresUtc: outcome.conflict.expiresUtc,
          heldByCaller: false,
        });
      }
    })();
  }, [draftId, mutable]);

  useEffect(() => {
    if (!mutable || draftId === null) {
      return;
    }

    const heartbeat = () => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) {
        return;
      }

      void heartbeatDraftWorkLease(draftId)
        .then((next) => {
          setLease(next);
          setLeaseLost(false);
        })
        .catch((error: unknown) => {
          if (readDraftWorkLeaseHeartbeatLost(error)) {
            setLeaseLost(true);
          }
        });
    };

    const intervalId = window.setInterval(heartbeat, SESSION_IDLE_FOCUS_HEARTBEAT_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [draftId, mutable]);

  useEffect(() => {
    if (!mutable || draftId === null) {
      return;
    }

    return () => {
      void releaseDraftWorkLease(draftId).catch(() => undefined);
    };
  }, [draftId, mutable]);

  const stealLease = useCallback(async () => {
    if (draftId === null) {
      return;
    }

    setStealBusy(true);
    setStealError(null);

    try {
      const next = await stealDraftWorkLease(draftId);
      setLease(next);
      setLeaseLost(false);
    } catch (error: unknown) {
      setStealError(error instanceof Error ? error.message : "Could not take over the edit lease.");
    } finally {
      setStealBusy(false);
    }
  }, [draftId]);

  const heldByOther = lease !== null && !lease.heldByCaller && !leaseLost;

  return {
    lease,
    leaseLost,
    heldByOther,
    stealBusy,
    stealError,
    stealLease,
  };
}
