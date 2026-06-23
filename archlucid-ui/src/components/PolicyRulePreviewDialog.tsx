"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { getEffectivePolicyPacks } from "@/lib/api/policy-governance-api";
import {
  buildPolicyRulePreviewFallback,
  lookupPolicyRulePreviewInEffectivePacks,
  type PolicyRulePreview,
} from "@/lib/policy-rule-preview-lookup";
import { policyPacksEditHref, policyPacksRuleHref } from "@/lib/policy-packs-deep-link";

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

function previewFromProps(props: PolicyRulePreviewDialogProps): PolicyRulePreview {
  if (props.initialPreview !== null && props.initialPreview !== undefined) {
    return props.initialPreview;
  }

  return buildPolicyRulePreviewFallback({
    ruleId: props.ruleId,
    ruleLabel: props.ruleLabel,
    packId: props.packId,
    packName: props.packName,
    packVersion: props.packVersion,
  });
}

/** Side-panel style dialog showing the policy rule text behind a finding. */
export function PolicyRulePreviewDialog(props: PolicyRulePreviewDialogProps): ReactElement {
  const [preview, setPreview] = useState<PolicyRulePreview>(() => previewFromProps(props));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    setPreview(previewFromProps(props));
    setLoadError(null);

    if (props.initialPreview?.hasCuratedRuleText === true) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);

      try {
        const effective = await getEffectivePolicyPacks();
        const resolved =
          lookupPolicyRulePreviewInEffectivePacks(props.ruleId, effective.packs) ??
          buildPolicyRulePreviewFallback({
            ruleId: props.ruleId,
            ruleLabel: props.ruleLabel,
            packId: props.packId,
            packName: props.packName,
            packVersion: props.packVersion,
          });

        if (!cancelled) {
          setPreview(resolved);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load policy pack content.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    props.open,
    props.ruleId,
    props.ruleLabel,
    props.packId,
    props.packName,
    props.packVersion,
    props.initialPreview,
  ]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-xl" data-testid="policy-rule-preview-dialog">
        <DialogHeader>
          <DialogTitle>Policy rule</DialogTitle>
          <DialogDescription>
            This finding was evaluated against the rule below. Changing the assigned policy pack can change severity,
            recommendations, and review decisions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag kind="neutral" label={`Pack: ${preview.packName}`} />
            {preview.severity !== null ? <StatusTag kind="needs-attention" label={preview.severity} /> : null}
          </div>

          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Rule ID
            </p>
            <p className="m-0 mt-1 font-mono text-sm text-neutral-900 dark:text-neutral-100">{preview.ruleId}</p>
          </div>

          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Rule title
            </p>
            <p className="m-0 mt-1 font-medium text-neutral-900 dark:text-neutral-100">{preview.ruleTitle}</p>
          </div>

          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Rule text
            </p>
            <p className="m-0 mt-1 leading-relaxed text-neutral-800 dark:text-neutral-200">{preview.description}</p>
          </div>

          {preview.remediationGuidance.trim().length > 0 ? (
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Remediation guidance
              </p>
              <p className="m-0 mt-1 leading-relaxed text-neutral-800 dark:text-neutral-200">
                {preview.remediationGuidance}
              </p>
            </div>
          ) : null}

          {preview.evidenceHints.length > 0 ? (
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
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
            <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400" role="status">
              Loading policy pack rule text…
            </p>
          ) : null}

          {loadError !== null ? (
            <p className="m-0 text-xs text-rose-700 dark:text-rose-300" role="alert">
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
