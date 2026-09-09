"use client";

import { useCallback, useState } from "react";

import { upsertRealizedValueAttestation } from "@/lib/api/governance-stickiness-api-exceptions-schedules";
import type { UpsertRealizedValueAttestationRequest } from "@/lib/api/governance-stickiness-api-types";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { realizedValueAttestationMutationBlockedReason } from "@/lib/governance/realized-value-attestation-mutation-blocked-reason";

export function useRealizedValueAttestationMutation() {
  const [busy, setBusy] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveAttestation = useCallback(async (body: UpsertRealizedValueAttestationRequest): Promise<boolean> => {
    setBusy(true);
    setBlockedReason(null);
    setErrorMessage(null);

    try {
      await upsertRealizedValueAttestation(body);

      return true;
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const blocked = realizedValueAttestationMutationBlockedReason(failure);

      if (blocked !== null) {
        setBlockedReason(blocked);
      } else {
        setErrorMessage(failure.message);
      }

      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    busy,
    blockedReason,
    errorMessage,
    saveAttestation,
  };
}
