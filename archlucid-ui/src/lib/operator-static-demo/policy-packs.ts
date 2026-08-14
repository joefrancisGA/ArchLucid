import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import {
  CLAIMS_INTAKE_RULE_SET_VERSION,
} from "@/lib/samples/claims-intake/definition";
import {
  CUSTOMER_INTAKE_RULE_SET_VERSION,
} from "@/lib/samples/customer-intake-modernization/definition";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import type { EffectivePolicyPackSet, PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";

import { isStaticDemoPayloadFallbackEnabled } from "./eligibility";

export type PolicyPacksStaticFallbackOptions = {
  /**
   * When the Policy Packs API fails (network error, auth, empty deployment), serve the curated
   * Healthcare Claims pack even if demo env vars are unset — same logic as
   * {@link StaticDemoRunsListFallbackOptions.afterAuthorityListFailure} for run lists.
   */
  readonly afterAuthorityFailure?: boolean;
  /** When list/effective APIs succeed but return empty packs, merge curated Healthcare Claims sample layers. */
  readonly afterEmptyLiveResponse?: boolean;
};

function isPolicyPacksStaticFallbackActive(options?: PolicyPacksStaticFallbackOptions): boolean {
  // Buyer-polished shell uses the same env flags as static demo today; keep explicit so empty API responses still
  // merge curated Healthcare Claims sample layers if flags or option wiring ever diverge.
  if (!isOperatorExperienceFullShellEnv()) {
    return true;
  }

  if (isStaticDemoPayloadFallbackEnabled()) {
    return true;
  }

  if (options?.afterAuthorityFailure === true) {
    return true;
  }

  if (options?.afterEmptyLiveResponse === true) {
    return true;
  }

  return false;
}

export function tryStaticDemoPolicyPacksList(options?: PolicyPacksStaticFallbackOptions): PolicyPack[] | null {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return null;
  }

  return [
    {
      policyPackId: "demo-enterprise-privacy-pack",
      tenantId: "demo-tenant",
      workspaceId: "demo-workspace",
      projectId: "default",
      name: policyPackBuyerLabel("enterprise-privacy-v2", CUSTOMER_INTAKE_RULE_SET_VERSION),
      description: "Enterprise Privacy pack aligned with the Customer Intake modernization review.",
      packType: "BuiltIn",
      distributionScope: "Platform",
      status: "Active",
      createdUtc: "2026-01-08T12:00:00.000Z",
      currentVersion: CUSTOMER_INTAKE_RULE_SET_VERSION,
    },
    {
      policyPackId: "demo-healthcare-claims-pack",
      tenantId: "demo-tenant",
      workspaceId: "demo-workspace",
      projectId: "default",
      name: policyPackBuyerLabel("healthcare-claims-v3", CLAIMS_INTAKE_RULE_SET_VERSION),
      description: "Healthcare Claims pack aligned with the Claims Intake review.",
      packType: "BuiltIn",
      distributionScope: "Platform",
      status: "Active",
      createdUtc: "2026-01-10T12:00:00.000Z",
      currentVersion: CLAIMS_INTAKE_RULE_SET_VERSION,
    },
  ];
}

export function tryStaticDemoEffectivePolicyPacks(
  projectId: string,
  options?: PolicyPacksStaticFallbackOptions,
): EffectivePolicyPackSet | null {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return null;
  }

  const pid = projectId.trim().length > 0 ? projectId.trim() : "default";

  return {
    tenantId: "demo-tenant",
    workspaceId: "demo-workspace",
    projectId: pid,
    packs: [
      {
        policyPackId: "demo-enterprise-privacy-pack",
        name: policyPackBuyerLabel("enterprise-privacy-v2", CUSTOMER_INTAKE_RULE_SET_VERSION),
        version: CUSTOMER_INTAKE_RULE_SET_VERSION,
        packType: "BuiltIn",
        contentJson: JSON.stringify({
          complianceRuleIds: [],
          complianceRuleKeys: ["privacy.minimization.intake"],
          alertRuleIds: [],
          compositeAlertRuleIds: [],
          advisoryDefaults: {},
          metadata: { vertical: "enterprise", ruleSetId: "enterprise-privacy-v2" },
        }),
      },
      {
        policyPackId: "demo-healthcare-claims-pack",
        name: policyPackBuyerLabel("healthcare-claims-v3", CLAIMS_INTAKE_RULE_SET_VERSION),
        version: CLAIMS_INTAKE_RULE_SET_VERSION,
        packType: "BuiltIn",
        contentJson: JSON.stringify({
          complianceRuleIds: [],
          complianceRuleKeys: ["phi.minimization.intake"],
          alertRuleIds: [],
          compositeAlertRuleIds: [],
          advisoryDefaults: {},
          metadata: { vertical: "healthcare", ruleSetId: "healthcare-claims-v3" },
        }),
      },
    ],
  };
}

export function tryStaticDemoEffectivePolicyContent(
  options?: PolicyPacksStaticFallbackOptions,
): PolicyPackContentDocument | null {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return null;
  }

  return {
    complianceRuleIds: [],
    complianceRuleKeys: ["phi.minimization.intake", "claims.intake.boundary"],
    alertRuleIds: [],
    compositeAlertRuleIds: [],
    advisoryDefaults: {},
    metadata: { vertical: "healthcare" },
  };
}

export function mergePolicyPacksStateWithStaticDemo(
  packs: PolicyPack[],
  effective: EffectivePolicyPackSet | null,
  content: PolicyPackContentDocument | null,
  projectId: string,
  options?: PolicyPacksStaticFallbackOptions,
): { packs: PolicyPack[]; effective: EffectivePolicyPackSet | null; content: PolicyPackContentDocument | null } {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return { packs, effective, content };
  }

  let nextPacks = packs;

  if (nextPacks.length === 0) {
    const seeded = tryStaticDemoPolicyPacksList(options);

    if (seeded !== null) {
      nextPacks = seeded;
    }
  }

  let nextEffective = effective;

  if (nextEffective === null || nextEffective.packs.length === 0) {
    const seededEff = tryStaticDemoEffectivePolicyPacks(projectId, options);

    if (seededEff !== null) {
      nextEffective = seededEff;
    }
  }

  let nextContent = content;

  if (nextContent === null || (nextContent.complianceRuleKeys?.length ?? 0) === 0) {
    const seededDoc = tryStaticDemoEffectivePolicyContent(options);

    if (seededDoc !== null) {
      nextContent = seededDoc;
    }
  }

  return { packs: nextPacks, effective: nextEffective, content: nextContent };
}

export function staticDemoPolicyPacksFallbackBundle(
  projectId: string,
  options?: PolicyPacksStaticFallbackOptions,
): {
  packs: PolicyPack[];
  effective: EffectivePolicyPackSet;
  content: PolicyPackContentDocument;
} | null {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return null;
  }

  const list = tryStaticDemoPolicyPacksList(options);
  const eff = tryStaticDemoEffectivePolicyPacks(projectId, options);
  const doc = tryStaticDemoEffectivePolicyContent(options);

  if (list === null || eff === null || doc === null) {
    return null;
  }

  return { packs: list, effective: eff, content: doc };
}
