"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusTag } from "@/components/ui/status-tag";
import { useEffectivePolicyPacksQuery } from "@/hooks/use-effective-policy-packs-query";
import {
  buildPolicyRulePreviewFallback,
  lookupPolicyRulePreviewInEffectivePacks,
  type PolicyRulePreview,
} from "@/lib/policy/policy-rule-preview-lookup";
import { policyPacksEditHref, policyPacksRuleHref } from "@/lib/policy/policy-packs-deep-link";

export type PolicyRulePreviewDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly ruleId: string;
  readonly ruleLabel?: string | null;
  readonly packId?: string | null;
  readonly packName?: string | null;
  readonly packVersion?: string | null;
  readonly initialPreview?: PolicyRulePreview | null;
};

type PolicyRulePreviewSource = Pick<
  PolicyRulePreviewDialogProps,
  "ruleId" | "ruleLabel" | "packId" | "packName" | "packVersion" | "initialPreview"
>;

function previewFromSource(source: PolicyRulePreviewSource): PolicyRulePreview {
  if (source.initialPreview !== null && source.initialPreview !== undefined) {
    return source.initialPreview;
  }

  return buildPolicyRulePreviewFallback({
    ruleId: source.ruleId,
    ruleLabel: source.ruleLabel,
    packId: source.packId,
    packName: source.packName,
    packVersion: source.packVersion,
  });
}

/** Side-panel style dialog showing the policy rule text behind a finding. */
export function PolicyRulePreviewDialog(props: PolicyRulePreviewDialogProps): ReactElement {
  const {
    open,
    onOpenChange,
    ruleId,
    ruleLabel,
    packId,
    packName,
    packVersion,
    initialPreview,
  } = props;
  const [preview, setPreview] = useState<PolicyRulePreview>(() => previewFromSource(props));
  const shouldFetchEffective = open && initialPreview?.hasCuratedRuleText !== true;
  const effectivePacksQuery = useEffectivePolicyPacksQuery({ enabled: shouldFetchEffective });
  const loading = shouldFetchEffective && effectivePacksQuery.isPending;
  const loadError = effectivePacksQuery.isError
    ? effectivePacksQuery.error instanceof Error
      ? effectivePacksQuery.error.message
      : "Could not load policy pack content."
    : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const fallbackPreview = previewFromSource({
      ruleId,
      ruleLabel,
      packId,
      packName,
      packVersion,
      initialPreview,
    });

    if (initialPreview?.hasCuratedRuleText === true) {
      setPreview(fallbackPreview);
      return;
    }

    if (effectivePacksQuery.data !== undefined) {
      setPreview(
        lookupPolicyRulePreviewInEffectivePacks(ruleId, effectivePacksQuery.data.packs) ??
          buildPolicyRulePreviewFallback({
            ruleId,
            ruleLabel,
            packId,
            packName,
            packVersion,
          }),
      );

      return;
    }

    setPreview(fallbackPreview);
  }, [
    effectivePacksQuery.data,
    initialPreview,
    open,
    packId,
    packName,
    packVersion,
    ruleId,
    ruleLabel,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" data-testid="policy-rule-preview-dialog">
        <DialogHeader>
          <DialogTitle>Policy rule</DialogTitle>
          <DialogDescription>
            This finding was evaluated against the rule below. Changing the assigned policy pack can change severity,
            recommendations, and review decisions.
          </DialogDescription>
        </DialogHeader>

        <div className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag kind="neutral" label={`Pack: ${preview.packName}`} />
            {preview.severity !== null ? <StatusTag kind="needs-attention" label={preview.severity} /> : null}
          </div>

          <div>
            <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Rule ID
            </p>
            <p className={cn("m-0 mt-1 font-mono text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{preview.ruleId}</p>
          </div>

          <div>
            <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Rule title
            </p>
            <p className="m-0 mt-1 font-medium text-neutral-900 dark:text-neutral-100">{preview.ruleTitle}</p>
          </div>

          <div>
            <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Rule text
            </p>
            <p className="m-0 mt-1 leading-relaxed text-neutral-800 dark:text-neutral-200">{preview.description}</p>
          </div>

          {preview.remediationGuidance.trim().length > 0 ? (
            <div>
              <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Remediation guidance
              </p>
              <p className="m-0 mt-1 leading-relaxed text-neutral-800 dark:text-neutral-200">
                {preview.remediationGuidance}
              </p>
            </div>
          ) : null}

          {preview.evidenceHints.length > 0 ? (
            <div>
              <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Evidence hints
              </p>
              <ul className="m-0 mt-1 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300">
                {preview.evidenceHints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {loading ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
              Loading policy pack rule text…
            </p>
          ) : null}

          {loadError !== null ? (
            <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
              {loadError}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href={policyPacksRuleHref(preview.ruleId)}>Open rule in Policy Packs</Link>
          </Button>
          <Button type="button" variant="secondary" asChild>
            <Link href={policyPacksEditHref(preview.packId)}>Open policy pack</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
