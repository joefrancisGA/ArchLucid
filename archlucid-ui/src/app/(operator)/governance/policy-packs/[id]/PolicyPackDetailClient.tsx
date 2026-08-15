"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";

import { getPolicyPackVersion, listPolicyPacks, listPolicyPackWorkspaceSelection } from "@/lib/api";
import { parsePolicyPackContentDocument } from "@/lib/policy/policy-pack-impact-preview";
import { resolvePolicyPackDetailKind } from "@/lib/policy/policy-pack-detail-resolver";
import type { PolicyPack, PolicyPackContentDocument, PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

import { HealthcareClaimsPolicyPackDetail } from "./HealthcareClaimsPolicyPackDetail";
import { PolicyPackDetailEvidenceChrome } from "./PolicyPackDetailEvidenceChrome";
import { PolicyPackDetailLoadError } from "./PolicyPackDetailLoadError";
import { PolicyPackGenericDetail } from "./PolicyPackGenericDetail";
import { PolicyPackDetailNotFound } from "./PolicyPackDetailNotFound";
import { ResponsibleAiPolicyPackDetail } from "./ResponsibleAiPolicyPackDetail";

type PolicyPackDetailClientProps = {
  readonly policyPackId: string;
};

function withEvidenceChrome(node: ReactElement): ReactElement {
  return <PolicyPackDetailEvidenceChrome>{node}</PolicyPackDetailEvidenceChrome>;
}

function resolveWorkspaceEnablement(
  policyPackId: string,
  workspaceSelection: readonly PolicyPackWorkspaceSelectionItem[],
): { isEnabled: boolean; isGloballyActive: boolean } {
  const match =
    workspaceSelection.find((row) => row.policyPackId.trim() === policyPackId.trim()) ?? null;

  return {
    isEnabled: match?.isEnabled ?? false,
    isGloballyActive: match?.isGloballyActive ?? false,
  };
}

/**
 * Detail shell for `/governance/policy-packs/[id]` — sponsor-grade pack narratives for known packs,
 * API-enriched metadata when available, and a polished not-found state otherwise.
 */
export function PolicyPackDetailClient(props: PolicyPackDetailClientProps): React.JSX.Element {
  const { policyPackId } = props;
  const [packRecord, setPackRecord] = useState<PolicyPack | null>(null);
  const [packContent, setPackContent] = useState<PolicyPackContentDocument | null>(null);
  const [workspaceSelection, setWorkspaceSelection] = useState<PolicyPackWorkspaceSelectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const handleRetry = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let canceled = false;

    setPackRecord(null);
    setPackContent(null);
    setWorkspaceSelection([]);
    setLoading(true);
    setLoadFailed(false);

    void (async () => {
      try {
        const [packs, selection] = await Promise.all([
          listPolicyPacks(),
          listPolicyPackWorkspaceSelection().catch(() => [] as PolicyPackWorkspaceSelectionItem[]),
        ]);
        const match = packs.find((pack) => pack.policyPackId.trim() === policyPackId.trim()) ?? null;

        if (!canceled) {
          setPackRecord(match);
          setWorkspaceSelection(selection);
        }

        if (match !== null) {
          const version = match.currentVersion?.trim() ?? "";

          if (version.length > 0) {
            try {
              const versionDetail = await getPolicyPackVersion(policyPackId, version);

              if (!canceled) {
                setPackContent(parsePolicyPackContentDocument(versionDetail.contentJson));
              }
            } catch {
              if (!canceled) {
                setPackContent(null);
              }
            }
          } else if (!canceled) {
            setPackContent(null);
          }
        } else if (!canceled) {
          setPackContent(null);
        }
      } catch {
        if (!canceled) {
          setPackRecord(null);
          setPackContent(null);
          setWorkspaceSelection([]);
          setLoadFailed(true);
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
  }, [policyPackId, reloadToken]);

  const kind = resolvePolicyPackDetailKind(policyPackId, packRecord);
  const { isEnabled, isGloballyActive } = resolveWorkspaceEnablement(policyPackId, workspaceSelection);

  if (loading) {
    return (
      <div className="p-4" data-testid="policy-pack-detail-loading">
        <p className="m-0 text-al-text-secondary">Loading policy pack…</p>
      </div>
    );
  }

  if (loadFailed) {
    return withEvidenceChrome(<PolicyPackDetailLoadError onRetry={handleRetry} />);
  }

  if (kind === "healthcare-claims") {
    return withEvidenceChrome(<HealthcareClaimsPolicyPackDetail policyPackId={policyPackId} />);
  }

  if (kind === "responsible-ai") {
    return withEvidenceChrome(
      <ResponsibleAiPolicyPackDetail
        policyPackId={policyPackId}
        packRecord={packRecord}
        packContent={packContent}
        isEnabled={isEnabled}
        isGloballyActive={isGloballyActive}
      />,
    );
  }

  if (packRecord !== null) {
    return withEvidenceChrome(
      <PolicyPackGenericDetail
        policyPackId={policyPackId}
        packRecord={packRecord}
        packContent={packContent}
        isEnabled={isEnabled}
        isGloballyActive={isGloballyActive}
      />,
    );
  }

  return withEvidenceChrome(<PolicyPackDetailNotFound policyPackId={policyPackId} />);
}
