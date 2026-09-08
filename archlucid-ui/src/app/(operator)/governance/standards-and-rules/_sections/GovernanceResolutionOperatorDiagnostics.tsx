"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { GovernanceConflictsTable } from "@/components/governance/GovernanceConflictsTable";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import {
  governanceResolutionEffectivePolicyHeadingOperator,
  governanceResolutionEffectivePolicyHeadingReader,
  governanceResolutionRawOutputAccordionLabel,
  governanceResolutionResolutionDetailsHeadingOperator,
  governanceResolutionResolutionDetailsHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  governanceResolutionPackOrderingDisclosureHrefFromSearch,
  parseGovernanceResolutionPackOrderingOpenFromSearch,
} from "@/lib/governance/governance-resolution-pack-ordering-disclosure-url";
import {
  governanceResolutionCandidatesDisclosureHrefFromSearch,
  parseGovernanceResolutionCandidatesItemKeyFromSearch,
} from "@/lib/governance/governance-resolution-candidates-disclosure-url";
import {
  governanceResolutionRawOutputDisclosureHrefFromSearch,
  parseGovernanceResolutionRawOutputOpenFromSearch,
} from "@/lib/governance/governance-resolution-raw-output-disclosure-url";
import { governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";
import { policyPackBuyerGovernanceDetailHref } from "@/lib/policy/policy-pack-buyer-label";
import { resolveStandardsRulesPolicyPackProvenanceLabel } from "@/lib/standards-rules-rows";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";
import { GovernanceResolutionExportControls } from "./GovernanceResolutionExportControls";
import { StandardsRulesPolicyPackReference } from "./StandardsRulesPolicyPackReference";

type GovernanceResolutionOperatorDiagnosticsProps = {
  readonly model: GovernanceResolutionPageViewModel;
};

export function GovernanceResolutionOperatorDiagnostics(
  props: GovernanceResolutionOperatorDiagnosticsProps,
): React.JSX.Element {
  const m = props.model;
  const canMutateEnterprisePolicySurfaces = m.canMutateEnterprisePolicySurfaces;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const governanceResolutionPackOrderingOpenParam = searchParams.get("governanceResolutionPackOrderingOpen");
  const [packOrderingOpen, setPackOrderingOpenState] = useState(() =>
    parseGovernanceResolutionPackOrderingOpenFromSearch(governanceResolutionPackOrderingOpenParam),
  );

  const syncPackOrderingOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        governanceResolutionPackOrderingDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPackOrderingOpen = useCallback(
    (open: boolean) => {
      setPackOrderingOpenState(open);
      syncPackOrderingOpenToUrl(open);
    },
    [syncPackOrderingOpenToUrl],
  );

  useEffect(() => {
    setPackOrderingOpenState(
      parseGovernanceResolutionPackOrderingOpenFromSearch(governanceResolutionPackOrderingOpenParam),
    );
  }, [governanceResolutionPackOrderingOpenParam]);

  const governanceResolutionCandidatesItemKeyParam = searchParams.get("governanceResolutionCandidatesItemKey");
  const [openCandidatesItemKey, setOpenCandidatesItemKeyState] = useState(() =>
    parseGovernanceResolutionCandidatesItemKeyFromSearch(governanceResolutionCandidatesItemKeyParam),
  );
  const syncOpenCandidatesItemKeyToUrl = useCallback(
    (itemKey: string | null) => {
      router.replace(
        governanceResolutionCandidatesDisclosureHrefFromSearch(searchParams.toString(), itemKey, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setOpenCandidatesItemKey = useCallback(
    (itemKey: string | null) => {
      setOpenCandidatesItemKeyState(itemKey ?? "");
      syncOpenCandidatesItemKeyToUrl(itemKey);
    },
    [syncOpenCandidatesItemKeyToUrl],
  );
  useEffect(() => {
    setOpenCandidatesItemKeyState(
      parseGovernanceResolutionCandidatesItemKeyFromSearch(governanceResolutionCandidatesItemKeyParam),
    );
  }, [governanceResolutionCandidatesItemKeyParam]);

  const governanceResolutionRawOutputOpenParam = searchParams.get("governanceResolutionRawOutputOpen");
  const [rawOutputOpen, setRawOutputOpenState] = useState(() =>
    parseGovernanceResolutionRawOutputOpenFromSearch(governanceResolutionRawOutputOpenParam),
  );
  const syncRawOutputOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        governanceResolutionRawOutputDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setRawOutputOpen = useCallback(
    (open: boolean) => {
      setRawOutputOpenState(open);
      syncRawOutputOpenToUrl(open);
    },
    [syncRawOutputOpenToUrl],
  );

  useEffect(() => {
    setRawOutputOpenState(parseGovernanceResolutionRawOutputOpenFromSearch(governanceResolutionRawOutputOpenParam));
  }, [governanceResolutionRawOutputOpenParam]);

  return (
    <>
      <section className="mb-7" aria-labelledby="governance-conflicts-heading">
        <h3 id="governance-conflicts-heading" className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Policy pack conflicts ({m.data?.conflicts.length ?? 0})
        </h3>
        <p className={cn("mt-1 mb-3 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          When multiple assigned packs define the same governance item, the higher-precedence pack wins. Use the table to see
          which pack was selected, why, and open losing packs to change their assignment.
        </p>
        {(m.data?.conflicts ?? []).length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No conflicts detected for the current scope.</p>
        ) : (
          <GovernanceConflictsTable
            conflicts={m.data!.conflicts}
            decisions={m.data!.decisions}
            canEditPolicyPacks={canMutateEnterprisePolicySurfaces}
          />
        )}
      </section>

      <section className="mb-7" aria-labelledby="governance-effective-heading">
        <h3 id="governance-effective-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          <GlossaryTooltip termKey="effective_governance">
            {canMutateEnterprisePolicySurfaces
              ? governanceResolutionEffectivePolicyHeadingOperator
              : governanceResolutionEffectivePolicyHeadingReader}
          </GlossaryTooltip>
        </h3>
        <h4 className={cn("mt-2 mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Summary notes</h4>
        <ul className={OPERATOR_TYPOGRAPHY.body}>
          {(m.data?.notes ?? []).length === 0 ? (
            <li className="text-al-text-secondary">—</li>
          ) : (
            m.data!.notes.map((n) => <li key={n}>{n}</li>)
          )}
        </ul>

        <AdvancedOptionsAccordion
          className="mt-5"
          triggerLabel={governanceResolutionRawOutputAccordionLabel}
          open={rawOutputOpen}
          onOpenChange={setRawOutputOpen}
        >
          <div className="grid gap-4">
            <h4 className={cn("mt-0 mb-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Effective content</h4>
            <pre
              className={cn(
                "m-0 max-h-[400px] overflow-auto bg-neutral-100 p-3 dark:bg-neutral-800",
                OPERATOR_TYPOGRAPHY.micro,
              )}
            >
              {m.data ? JSON.stringify(m.data.effectiveContent, null, 2) : " — "}
            </pre>
            <details
              className="max-w-3xl"
              open={packOrderingOpen}
              onToggle={(event) => {
                setPackOrderingOpen((event.currentTarget as HTMLDetailsElement).open);
              }}
            >
              <summary className={cn("cursor-pointer font-semibold text-al-text-secondary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                How packs are ordered (scope, pins, ties)
              </summary>
              <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                <strong>Project</strong> wins over <strong>Workspace</strong> over <strong>Tenant</strong>. Pinned beats unpinned at the
                same tier; newest assignment breaks ties. Conflicts surface when definitions disagree.
              </p>
            </details>
          </div>
        </AdvancedOptionsAccordion>
      </section>

      <section className="mb-7" aria-labelledby="governance-resolution-details-heading">
        <h3 id="governance-resolution-details-heading" className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {canMutateEnterprisePolicySurfaces
            ? governanceResolutionResolutionDetailsHeadingOperator
            : governanceResolutionResolutionDetailsHeadingReader}
        </h3>
        <h4 className={cn("mt-2 mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Resolution decisions ({m.data?.decisions.length ?? 0})
        </h4>
        <div className="grid gap-2.5">
          {(m.data?.decisions ?? []).map((d, i) => {
            const candidatesItemKey = `${d.itemType}:${d.itemKey}`;

            return (
            <article
              key={`${d.itemType}-${d.itemKey}-${i}`}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 bg-neutral-50 dark:bg-neutral-950"
            >
              <div className={OPERATOR_TYPOGRAPHY.cardTitle}>
                <strong>{d.itemType}</strong> <code>{d.itemKey}</code>
              </div>
              <div className={cn("mt-1.5", OPERATOR_TYPOGRAPHY.body)}>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
                  <span>Winner:</span>
                  <StandardsRulesPolicyPackReference
                    label={d.winningPolicyPackName}
                    href={
                      d.winningPolicyPackId.trim().length > 0
                        ? policyPackBuyerGovernanceDetailHref(d.winningPolicyPackId) ??
                          governancePolicyPackDetailPath(d.winningPolicyPackId)
                        : null
                    }
                    provenanceLabel={resolveStandardsRulesPolicyPackProvenanceLabel({
                      ruleKey: d.itemKey,
                      policyPackId: d.winningPolicyPackId,
                      data: m.data,
                    })}
                  />
                  <span>
                    ({d.winningVersion}) — scope <code>{d.winningScopeLevel}</code>
                  </span>
                </div>
              </div>
              <div className={cn("mt-1.5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{d.resolutionReason}</div>
              <details
                className={cn("mt-2", OPERATOR_TYPOGRAPHY.micro)}
                open={openCandidatesItemKey === candidatesItemKey}
                onToggle={(event) => {
                  const nextOpen = event.currentTarget.open;
                  setOpenCandidatesItemKey(nextOpen ? candidatesItemKey : null);
                }}
              >
                <summary>All candidates</summary>
                <pre className="overflow-auto max-h-[220px]">{JSON.stringify(d.candidates, null, 2)}</pre>
              </details>
            </article>
            );
          })}
        </div>
      </section>

      <GovernanceResolutionExportControls model={m} />
    </>
  );
}
