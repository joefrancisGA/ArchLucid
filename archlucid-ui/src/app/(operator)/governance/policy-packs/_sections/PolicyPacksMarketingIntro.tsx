import { cn } from "@/lib/utils";
import Link from "next/link";

import { EnterpriseControlsExecutePageHint } from "@/components/EnterpriseControlsContextHints";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import {
  policyPacksDeltaDemoBannerLine,
  policyPacksOutcomeBannerLine,
  policyPacksPageLeadOperator,
  policyPacksPageLeadReader,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";

export type PolicyPacksMarketingIntroProps = {
  buyerPolishedShell: boolean;
  canMutatePacks: boolean;
};

export function PolicyPacksMarketingIntro(props: PolicyPacksMarketingIntroProps) {
  const { canMutatePacks } = props;

  return (
    <>
      <p
        className={cn("mb-3 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/90 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.body)}
        data-testid="policy-packs-outcome-banner"
      >
        {policyPacksOutcomeBannerLine}
      </p>
      <p
        className={cn("mb-3 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.body)}
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
      <p className={cn("mb-3 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="policy-packs-bundled-defaults-note">
        New tenants receive two seeded governance bundles labeled{" "}
        <strong className="font-semibold">Bundled default (platform)</strong> in Policy packs (
        <span className="whitespace-nowrap">AI Governance / Responsible AI</span>{" "}
        and <span className="whitespace-nowrap">Security Architecture Baseline</span>). They evaluate like other packs; platform bundles{" "}
        <strong className="font-semibold">cannot be republished</strong> from this page (clone into a tenant-owned pack to customize).
      </p>
      <p className={cn("mb-3 max-w-3xl leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Policy packs are <strong>versioned governance bundles</strong>: they pin compliance rule references, advisory
        defaults, and alert posture for a tenant, workspace, or project so every architecture review evaluates against
        the same explicit bar as your team scales.
      </p>
      <p className={cn("mb-2 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        A <GlossaryTooltip termKey="policy_pack">policy pack</GlossaryTooltip> bundles versioned controls and
        advisory defaults for your scope — {canMutatePacks ? policyPacksPageLeadOperator : policyPacksPageLeadReader}
      </p>
      <EnterpriseControlsExecutePageHint className="mb-3" />
    </>
  );
}
