"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type SetStateAction } from "react";

import { FindingPolicyPackBadge } from "@/components/findings/FindingPolicyPackBadge";
import { FindingPolicyRuleBadge } from "@/components/findings/FindingPolicyRuleBadge";
import { PolicyRulePreviewDialog } from "@/components/policy/PolicyRulePreviewDialog";
import type {
  FindingPolicyCitationLink,
  FindingPolicyPackCitationLink,
} from "@/lib/findings/finding-policy-evidence-citations";
import {
  parsePolicyRulePreviewIdFromSearch,
  policyRulePreviewPanelsHrefFromSearch,
} from "@/lib/policy/policy-rule-preview-panels-url";

export type FindingPolicyTraceabilityBadgesProps = {
  readonly pack?: FindingPolicyPackCitationLink | null;
  readonly policy?: FindingPolicyCitationLink | null;
  readonly className?: string;
};

/** Prominent pack + rule badges that open an inline policy rule preview dialog. */
export function FindingPolicyTraceabilityBadges(props: FindingPolicyTraceabilityBadgesProps): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const rulePreviewIdParam = searchParams.get("rulePreviewId");
  const pack = props.pack ?? null;
  const policy = props.policy ?? null;
  const ruleId = policy?.ruleId ?? "";
  const ruleLabel = policy?.ruleLabel ?? null;
  const [previewOpen, setPreviewOpenState] = useState(() => {
    const urlRuleId = parsePolicyRulePreviewIdFromSearch(rulePreviewIdParam);

    return urlRuleId.length > 0 && urlRuleId === ruleId.trim();
  });

  const syncRulePreviewIdToUrl = useCallback(
    (nextRuleId: string | null) => {
      router.replace(policyRulePreviewPanelsHrefFromSearch(searchParams.toString(), nextRuleId, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setPreviewOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setPreviewOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncRulePreviewIdToUrl(next && ruleId.trim().length > 0 ? ruleId : null);

        return next;
      });
    },
    [ruleId, syncRulePreviewIdToUrl],
  );

  useEffect(() => {
    const urlRuleId = parsePolicyRulePreviewIdFromSearch(rulePreviewIdParam);
    const trimmedRuleId = ruleId.trim();

    if (urlRuleId.length > 0 && urlRuleId === trimmedRuleId) {
      setPreviewOpenState(true);

      return;
    }

    if (urlRuleId.length === 0) {
      setPreviewOpenState(false);
    }
  }, [ruleId, rulePreviewIdParam]);

  if (pack === null && policy === null) {
    return null;
  }

  return (
    <>
      <div
        className={cn("flex flex-wrap items-center gap-2", props.className)}
        data-testid="finding-policy-traceability-badges"
      >
        {pack !== null ? (
          <FindingPolicyPackBadge
            policyPackId={pack.packId}
            policyPackLabel={pack.packName}
            onPreviewClick={() => {
              setPreviewOpen(true);
            }}
          />
        ) : null}
        {policy !== null ? (
          <FindingPolicyRuleBadge
            policyRuleId={policy.ruleId}
            policyRuleLabel={policy.ruleLabel}
            onPreviewClick={() => {
              setPreviewOpen(true);
            }}
          />
        ) : null}
      </div>

      {ruleId.trim().length > 0 ? (
        <PolicyRulePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          ruleId={ruleId}
          ruleLabel={ruleLabel}
          packId={pack?.packId ?? null}
          packName={pack?.packName ?? null}
        />
      ) : null}
    </>
  );
}
