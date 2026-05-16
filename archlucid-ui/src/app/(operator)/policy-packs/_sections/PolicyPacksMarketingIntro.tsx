import Link from "next/link";

import { EnterpriseControlsExecutePageHint } from "@/components/EnterpriseControlsContextHints";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import {
  policyPacksOutcomeBannerLine,
  policyPacksPageLeadOperator,
  policyPacksPageLeadOperatorBuyerPolished,
  policyPacksPageLeadReader,
  policyPacksPageLeadReaderBuyerPolished,
} from "@/lib/enterprise-controls-context-copy";

export type PolicyPacksMarketingIntroProps = {
  buyerPolishedShell: boolean;
  canMutatePacks: boolean;
};

export function PolicyPacksMarketingIntro(props: PolicyPacksMarketingIntroProps) {
  const { buyerPolishedShell, canMutatePacks } = props;

  return (
    <>
      {!buyerPolishedShell ? (
        <p
          className="mb-3 max-w-prose rounded-md border border-neutral-200 bg-neutral-50/90 px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200"
          data-testid="policy-packs-outcome-banner"
        >
          {policyPacksOutcomeBannerLine}
        </p>
      ) : null}
      {buyerPolishedShell ? (
        <p className="mb-3 max-w-prose rounded-md border border-teal-100 bg-teal-50/70 px-3 py-2 text-sm text-neutral-900 dark:border-teal-900/45 dark:bg-teal-950/35 dark:text-neutral-100">
          <strong className="font-semibold">Healthcare Claims sample pack</strong> enforces PHI minimization expectations in
          review outputs, aligns advisory defaults with claims-intake patterns, and keeps alert posture consistent with the
          governed review story in this workspace.
        </p>
      ) : null}
      {buyerPolishedShell ? null : (
        <p className="mb-3 max-w-prose text-xs text-neutral-600 dark:text-neutral-400" data-testid="policy-packs-bundled-defaults-note">
          New tenants receive two seeded governance bundles labeled{" "}
          <strong className="font-semibold">Bundled default (platform)</strong> in Policy packs (
          <span className="whitespace-nowrap">AI Governance / Responsible AI</span>{" "}
          and <span className="whitespace-nowrap">Security Architecture Baseline</span>). They evaluate like other packs; platform bundles{" "}
          <strong className="font-semibold">cannot be republished</strong> from this page (clone into a tenant-owned pack to customize).
        </p>
      )}
      {buyerPolishedShell ? null : (
        <p className="mb-3 max-w-prose text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Policy packs are <strong>versioned governance bundles</strong>: they pin compliance rule references, advisory
          defaults, and alert posture for a tenant, workspace, or project so every architecture review evaluates against
          the same explicit bar as your team scales.
        </p>
      )}
      <p className="mb-2 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        {buyerPolishedShell ? (
          <>
            A <GlossaryTooltip termKey="policy_pack">policy pack</GlossaryTooltip> defines which compliance checks apply
            to reviews in this workspace —{" "}
            {canMutatePacks ? policyPacksPageLeadOperatorBuyerPolished : policyPacksPageLeadReaderBuyerPolished}{" "}
            <Link href="/governance-resolution" className="font-medium text-teal-800 underline dark:text-teal-300">
              How conflicts are resolved
            </Link>
            .
          </>
        ) : (
          <>
            A <GlossaryTooltip termKey="policy_pack">policy pack</GlossaryTooltip> bundles versioned controls and
            advisory defaults for your scope — {canMutatePacks ? policyPacksPageLeadOperator : policyPacksPageLeadReader}{" "}
            <Link href="/governance-resolution" className="font-medium text-teal-800 underline dark:text-teal-300">
              Governance resolution
            </Link>
            .
          </>
        )}
      </p>
      {buyerPolishedShell ? null : <EnterpriseControlsExecutePageHint className="mb-3" />}
    </>
  );
}
