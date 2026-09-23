"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement, type SetStateAction } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

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
  const pathname = usePathname() ?? "";
  const pack = props.pack ?? null;
  const policy = props.policy ?? null;
  const ruleId = policy?.ruleId ?? "";
  const ruleLabel = policy?.ruleLabel ?? null;
  const readPreviewOpenFromUrl = (): boolean => {
    const urlRuleId = parsePolicyRulePreviewIdFromSearch(
      new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("rulePreviewId"),
    );

    return urlRuleId.length > 0 && urlRuleId === ruleId.trim();
  };
  const [previewOpen, setPreviewOpenState] = useState(readPreviewOpenFromUrl);
  const previewOpenRef = useRef(previewOpen);
  previewOpenRef.current = previewOpen;

  const syncRulePreviewIdToUrl = useCallback(
    (nextRuleId: string | null) => {
      commitHrefIfChanged(
        policyRulePreviewPanelsHrefFromSearch(readWindowLocationSearch(), nextRuleId, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setPreviewOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setPreviewOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (previewOpenRef.current === next) {
          return current;
        }

        previewOpenRef.current = next;
        syncRulePreviewIdToUrl(next && ruleId.trim().length > 0 ? ruleId : null);

        return next;
      });
    },
    [ruleId, syncRulePreviewIdToUrl],
  );

  useEffect(() => {
    const syncPreviewOpenFromUrl = (): void => {
      const next = readPreviewOpenFromUrl();

      if (previewOpenRef.current === next) {
        return;
      }

      previewOpenRef.current = next;
      setPreviewOpenState(next);
    };

    syncPreviewOpenFromUrl();
    window.addEventListener("popstate", syncPreviewOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncPreviewOpenFromUrl);
    };
  }, [ruleId]);

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
