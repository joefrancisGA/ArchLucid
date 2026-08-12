import { cn } from "@/lib/utils";
import Link from "next/link";

import { EnterpriseControlsExecutePageHint } from "@/components/EnterpriseControlsContextHints";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import {
  policyPacksDeltaDemoBannerLine,
  policyPacksOutcomeBannerLine,
  policyPacksPageLeadOperator,
  policyPacksPageLeadOperatorBuyerPolished,
  policyPacksPageLeadReader,
  policyPacksPageLeadReaderBuyerPolished,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";

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
          className={cn("mb-3 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/90 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.body)}
          data-testid="policy-packs-outcome-banner"
        >
          {policyPacksOutcomeBannerLine}
        </p>
      ) : null}
      {!buyerPolishedShell ? (
        <p
          className={cn("mb-3 max-w-3xl rounded-md border border-teal-200/80 bg-teal-50/60 px-3 py-2 text-al-text-primary dark:border-teal-900/50 dark:bg-teal-950/30", OPERATOR_TYPOGRAPHY.body)}
          data-testid="policy-packs-delta-demo-banner"
        >
          {policyPacksDeltaDemoBannerLine}{" "}
          <Link
            href={POLICY_PACK_DELTA_DEMO_HELP_PATH}
            className={OPERATOR_LINK.inline}
          >
            Open demo script
          </Link>
          .
        </p>
      ) : null}
      {buyerPolishedShell ? (
        <p className={cn("mb-3 max-w-3xl rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}>
          <strong className="font-semibold">Healthcare Claims sample pack</strong> enforces PHI minimization expectations in
          review outputs, aligns advisory defaults with claims-intake patterns, and keeps alert posture consistent with the
          governed review story in this workspace.
        </p>
      ) : null}
      {buyerPolishedShell ? null : (
        <p className={cn("mb-3 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="policy-packs-bundled-defaults-note">
          New tenants receive two seeded governance bundles labeled{" "}
          <strong className="font-semibold">Bundled default (platform)</strong> in Policy packs (
          <span className="whitespace-nowrap">AI Governance / Responsible AI</span>{" "}
          and <span className="whitespace-nowrap">Security Architecture Baseline</span>). They evaluate like other packs; platform bundles{" "}
          <strong className="font-semibold">cannot be republished</strong> from this page (clone into a tenant-owned pack to customize).
        </p>
      )}
      {buyerPolishedShell ? null : (
        <p className={cn("mb-3 max-w-3xl leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Policy packs are <strong>versioned governance bundles</strong>: they pin compliance rule references, advisory
          defaults, and alert posture for a tenant, workspace, or project so every architecture review evaluates against
          the same explicit bar as your team scales.
        </p>
      )}
      <p className={cn("mb-2 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {buyerPolishedShell ? (
          <>
            A <GlossaryTooltip termKey="policy_pack">policy pack</GlossaryTooltip> defines which compliance checks apply
            to reviews in this workspace —{" "}
            {canMutatePacks ? policyPacksPageLeadOperatorBuyerPolished : policyPacksPageLeadReaderBuyerPolished}
          </>
        ) : (
          <>
            A <GlossaryTooltip termKey="policy_pack">policy pack</GlossaryTooltip> bundles versioned controls and
            advisory defaults for your scope — {canMutatePacks ? policyPacksPageLeadOperator : policyPacksPageLeadReader}
          </>
        )}
      </p>
      {buyerPolishedShell ? null : <EnterpriseControlsExecutePageHint className="mb-3" />}
    </>
  );
}
