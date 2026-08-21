import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { formatActivePolicyPackSummaryBody } from "@/lib/policy/policy-pack-enforced-rules";
import { policyPackBuyerGovernanceDetailHref } from "@/lib/policy/policy-pack-buyer-label";
import { POLICY_PACKS_ACTIVE_PACK_CARD_TITLE } from "@/lib/policy/policy-packs-page";
import { policyPackTypeBuyerDisplayLabel } from "@/lib/policy/policy-pack-type-label";
import {
  OPERATOR_KPI_CARD_DESCRIPTION,
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { EffectivePolicyPackSet, PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";
import { cn } from "@/lib/utils";

export type PolicyPacksActivePackSummaryCardProps = {
  readonly effective: EffectivePolicyPackSet | null;
  readonly effectiveContent: PolicyPackContentDocument | null;
  readonly selectedPack: PolicyPack | undefined;
  readonly enforcedRuleCount: number;
  readonly canMutatePacks: boolean;
  readonly onOpenCatalog: () => void;
};

function resolveActivePackName(
  effective: EffectivePolicyPackSet | null,
  selectedPack: PolicyPack | undefined,
): string {
  const fromEffective = effective?.packs[0]?.name?.trim() ?? "";

  if (fromEffective.length > 0) {
    return fromEffective;
  }

  const fromSelected = selectedPack?.name?.trim() ?? "";

  if (fromSelected.length > 0) {
    return fromSelected;
  }

  return " — ";
}

function resolveActivePackVersion(
  effective: EffectivePolicyPackSet | null,
  selectedPack: PolicyPack | undefined,
): string {
  const fromEffective = effective?.packs[0]?.version?.trim() ?? "";

  if (fromEffective.length > 0) {
    return fromEffective;
  }

  return selectedPack?.currentVersion?.trim() ?? " — ";
}

export function PolicyPacksActivePackSummaryCard(props: PolicyPacksActivePackSummaryCardProps) {
  const {
    effective,
    effectiveContent,
    selectedPack,
    enforcedRuleCount,
    canMutatePacks,
    onOpenCatalog,
  } = props;
  const packName = resolveActivePackName(effective, selectedPack);
  const packVersion = resolveActivePackVersion(effective, selectedPack);
  const packType = selectedPack?.packType ?? effective?.packs[0]?.packType ?? "";
  const isEnabled =
    selectedPack !== undefined &&
    (effective?.packs ?? []).some((pack) => pack.policyPackId === selectedPack.policyPackId);
  const ruleSetId = effectiveContent?.metadata?.ruleSetId?.trim() ?? "healthcare-claims-v3";
  const detailHref = policyPackBuyerGovernanceDetailHref(ruleSetId);

  return (
    <Card data-testid="policy-packs-active-pack-summary">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_KPI_CARD_TITLE}>{POLICY_PACKS_ACTIVE_PACK_CARD_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{packName}</p>
          <StatusTag kind={isEnabled ? "ready" : "neutral"} label={isEnabled ? "Enabled in workspace" : "Not in scope"} />
          {packVersion !== " — " ? <StatusTag kind="neutral" label={`Version ${packVersion}`} /> : null}
        </div>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>
          {formatActivePolicyPackSummaryBody(packName, enforcedRuleCount)}
        </p>
        <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
          <div>
            <dt className="text-al-text-secondary">Scope</dt>
            <dd className="m-0 text-al-text-primary">Workspace</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Pack type</dt>
            <dd className="m-0 text-al-text-primary">{policyPackTypeBuyerDisplayLabel(packType)}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Enforced rules</dt>
            <dd className="m-0 text-al-text-primary">{enforcedRuleCount}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2 pt-1">
          {canMutatePacks ? (
            <button
              type="button"
              className={cn(
                "inline-flex min-h-7 items-center rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[13px] font-medium text-al-text-primary shadow-sm hover:bg-al-surface-raised dark:border-neutral-600 dark:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.badge,
              )}
              onClick={onOpenCatalog}
            >
              Open workspace packs
            </button>
          ) : detailHref !== null ? (
            <Link className={OPERATOR_LINK.inline} href={detailHref}>
              View pack details
            </Link>
          ) : (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>View enforced rules below</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
