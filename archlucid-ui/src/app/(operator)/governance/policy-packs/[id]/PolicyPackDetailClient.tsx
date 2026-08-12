"use client";

import { useEffect, useState, type ReactElement } from "react";

import { listPolicyPacks } from "@/lib/api";
import type { PolicyPack } from "@/types/policy-packs";

import { HealthcareClaimsPolicyPackDetail } from "./HealthcareClaimsPolicyPackDetail";
import { PolicyPackDetailEvidenceChrome } from "./PolicyPackDetailEvidenceChrome";
import { PolicyPackGenericDetail } from "./PolicyPackGenericDetail";
import {
  isSampleResponsibleAiPolicyPack,
  resolvePolicyPackDetailKind,
} from "@/lib/policy/policy-pack-detail-resolver";
import { PolicyPackDetailNotFound } from "./PolicyPackDetailNotFound";
import { ResponsibleAiPolicyPackDetail } from "./ResponsibleAiPolicyPackDetail";

type PolicyPackDetailClientProps = {
  readonly policyPackId: string;
};

function withEvidenceChrome(node: ReactElement): ReactElement {
  return <PolicyPackDetailEvidenceChrome>{node}</PolicyPackDetailEvidenceChrome>;
}

/**
 * Detail shell for `/governance/policy-packs/[id]` — sponsor-grade pack narratives for known packs,
 * API-enriched metadata when available, and a polished not-found state otherwise.
 */
export function PolicyPackDetailClient(props: PolicyPackDetailClientProps): React.JSX.Element {
  const { policyPackId } = props;
  const [packRecord, setPackRecord] = useState<PolicyPack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);

      try {
        const packs = await listPolicyPacks();
        const match = packs.find((pack) => pack.policyPackId.trim() === policyPackId.trim()) ?? null;

        if (!canceled) {
          setPackRecord(match);
        }
      } catch {
        if (!canceled) {
          setPackRecord(null);
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [policyPackId]);

  const kind = resolvePolicyPackDetailKind(policyPackId, packRecord);

  if (kind === "healthcare-claims") {
    return withEvidenceChrome(<HealthcareClaimsPolicyPackDetail policyPackId={policyPackId} />);
  }

  if (kind === "responsible-ai") {
    return withEvidenceChrome(
      <ResponsibleAiPolicyPackDetail
        policyPackId={policyPackId}
        packRecord={packRecord}
        isSample={isSampleResponsibleAiPolicyPack(policyPackId, packRecord)}
      />,
    );
  }

  if (loading) {
    return (
      <div className="p-4" data-testid="policy-pack-detail-loading">
        <p className="m-0 text-al-text-secondary">Loading policy pack…</p>
      </div>
    );
  }

  if (packRecord !== null) {
    return withEvidenceChrome(
      <PolicyPackGenericDetail policyPackId={policyPackId} packRecord={packRecord} />,
    );
  }

  return withEvidenceChrome(<PolicyPackDetailNotFound policyPackId={policyPackId} />);
}
