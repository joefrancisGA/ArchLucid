"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import type { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { BUYER_SHOWCASE_POLICY_PACK_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { resolveProductionEvalChromeFromStorage } from "@/lib/resolve-production-eval-chrome-from-storage";
import { findingDetailHeadingTitle } from "@/lib/findings/finding-display-from-inspect";
import { policyPacksRuleHref } from "@/lib/policy/policy-packs-deep-link";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolvePolicyRuleIdFromInspect, resolvePolicyRuleLabelFromInspect } from "@/lib/findings/finding-policy-evidence-citations";
import {
  FINDING_INSPECT_TECHNICAL_RULE_OPEN_PARAM,
  findingInspectTechnicalRuleDisclosureHrefFromSearch,
  parseFindingInspectTechnicalRuleOpenFromSearch,
} from "@/lib/findings/finding-inspect-technical-rule-disclosure-url";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export type FindingInspectWhyMattersSectionProps = {
  readonly payload: FindingInspectPayload;
  readonly variant: "detail" | "inspect";
  readonly demoFillGaps: boolean;
  readonly whyThisMattersNarrative: string | null;
};

/**
 * Sponsor-readable rationale plus primary rule. Technical rule id stays collapsible — opened by default only on inspect.
 */
export function FindingInspectWhyMattersSection({
  payload,
  variant,
  demoFillGaps,
  whyThisMattersNarrative,
}: FindingInspectWhyMattersSectionProps): ReactElement {
  const findingTitle = findingDetailHeadingTitle(payload);
  const policyRuleId = resolvePolicyRuleIdFromInspect(payload);
  const policyRuleLabel = resolvePolicyRuleLabelFromInspect(payload, policyRuleId);
  const pathname = usePathname() ?? "/";
  const defaultTechnicalRuleOpen = variant === "inspect";
  const readTechnicalRuleOpenFromUrl = (): boolean | null => {
    const param = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get(
      FINDING_INSPECT_TECHNICAL_RULE_OPEN_PARAM,
    );

    if (param === null) {
      return null;
    }

    return parseFindingInspectTechnicalRuleOpenFromSearch(param);
  };
  const [technicalRuleOpen, setTechnicalRuleOpenState] = useState(() => {
    const fromUrl = readTechnicalRuleOpenFromUrl();

    return fromUrl ?? defaultTechnicalRuleOpen;
  });
  const technicalRuleOpenRef = useRef(technicalRuleOpen);
  technicalRuleOpenRef.current = technicalRuleOpen;
  const syncTechnicalRuleOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        findingInspectTechnicalRuleDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );
  const setTechnicalRuleOpen = useCallback(
    (open: boolean) => {
      if (technicalRuleOpenRef.current === open) {
        return;
      }

      technicalRuleOpenRef.current = open;
      setTechnicalRuleOpenState(open);
      syncTechnicalRuleOpenToUrl(open);
    },
    [syncTechnicalRuleOpenToUrl],
  );

  useEffect(() => {
    const syncTechnicalRuleOpenFromUrl = (): void => {
      const fromUrl = readTechnicalRuleOpenFromUrl();

      if (fromUrl === null) {
        return;
      }

      if (technicalRuleOpenRef.current === fromUrl) {
        return;
      }

      technicalRuleOpenRef.current = fromUrl;
      setTechnicalRuleOpenState(fromUrl);
    };

    syncTechnicalRuleOpenFromUrl();
    window.addEventListener("popstate", syncTechnicalRuleOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncTechnicalRuleOpenFromUrl);
    };
  }, []);

  const whyHeading =
    findingTitle.trim().length > 0 && findingTitle !== "Finding detail"
      ? `Why ${findingTitle} matters`
      : "Why this matters";

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{whyHeading}</h2>
      {whyThisMattersNarrative ? (
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {whyThisMattersNarrative}
        </p>
      ) : demoFillGaps ? (
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Sensitive fields (PHI) are carried through the intake path into downstream services. The finalized review
          package documents where patient identifiers stop and how monitoring validates ongoing minimization.
        </p>
      ) : (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          — (no dedicated rationale on file; see primary rule and evidence below.)
        </p>
      )}
      <dl className={cn("mt-3 space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {(policyRuleLabel ?? policyRuleId) ? (
          <div>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Primary rule</dt>
            <dd className="m-0 mt-1">
              {policyRuleId !== null ? (
                <Link
                  href={policyPacksRuleHref(policyRuleId)}
                  className={OPERATOR_LINK.nav}
                >
                  {policyRuleLabel ?? policyRuleId}
                </Link>
              ) : (
                policyRuleLabel
              )}
            </dd>
          </div>
        ) : resolveProductionEvalChromeFromStorage() ? (
          <div>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Primary rule</dt>
            <dd className="m-0 mt-1">{BUYER_SHOWCASE_POLICY_PACK_LABEL} — PHI minimization at intake</dd>
          </div>
        ) : null}
      </dl>
      {payload.decisionRuleId ? (
        <div className="mt-3">
          <CollapsibleSection
            title="Technical rule identifier"
            open={technicalRuleOpen}
            onToggle={setTechnicalRuleOpen}
          >
            <div className="flex flex-wrap items-center gap-2">
              <code className={cn("rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>
                {payload.decisionRuleId}
              </code>
              <CopyIdButton value={payload.decisionRuleId} aria-label="Copy rule identifier" />
            </div>
          </CollapsibleSection>
        </div>
      ) : null}
    </section>
  );
}
