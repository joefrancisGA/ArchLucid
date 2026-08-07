import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { HelpTopicMarkdownView } from "../HelpTopicMarkdownView";
import { HelpAlertsGuideView } from "../_sections/HelpAlertsGuideView";
import { HelpDigestsGuideView } from "../_sections/HelpDigestsGuideView";
import { HelpApiContractsGuideView } from "../_sections/HelpApiContractsGuideView";
import { HelpBillingAndPlansGuideView } from "../_sections/HelpBillingAndPlansGuideView";
import { HelpExecutiveSummaryGuideView } from "../_sections/HelpExecutiveSummaryGuideView";
import { HelpFindingsGuideView } from "../_sections/HelpFindingsGuideView";
import { HelpGlossaryPageView } from "../_sections/HelpGlossaryPageView";
import { HelpUsersAndRolesGuideView } from "../_sections/HelpUsersAndRolesGuideView";
import { HelpCliUsageTechnicalReferenceView } from "../_sections/HelpCliUsageTechnicalReferenceView";
import { HelpGovernanceApprovalGuideView } from "../_sections/HelpGovernanceApprovalGuideView";
import { HelpAzurePermissionsGuideView } from "../_sections/HelpAzurePermissionsGuideView";
import { HelpAuditTrailGuideView } from "../_sections/HelpAuditTrailGuideView";
import { HelpReviewPackagesGuideView } from "../_sections/HelpReviewPackagesGuideView";
import { HelpReviewGuideView } from "../_sections/HelpReviewGuideView";
import { HelpPilotGuideView } from "../_sections/HelpPilotGuideView";
import { HelpConfigurationReferenceGuideView } from "../_sections/HelpConfigurationReferenceGuideView";
import { SecurityTrustHelpEvidenceOrientationStrip } from "../_sections/SecurityTrustHelpEvidenceOrientationStrip";
import { AcceleratorChooserHelpEvidenceOrientationStrip } from "../_sections/AcceleratorChooserHelpEvidenceOrientationStrip";
import { AdminDiagnosticsHelpEvidenceOrientationStrip } from "../_sections/AdminDiagnosticsHelpEvidenceOrientationStrip";
import { AuthenticationSignInHelpEvidenceOrientationStrip } from "../_sections/AuthenticationSignInHelpEvidenceOrientationStrip";
import { AzureBoardsHelpEvidenceOrientationStrip } from "../_sections/AzureBoardsHelpEvidenceOrientationStrip";
import { CaiqSigResponseHelpEvidenceOrientationStrip } from "../_sections/CaiqSigResponseHelpEvidenceOrientationStrip";
import { ScopeHelpEvidenceOrientationStrip } from "../_sections/ScopeHelpEvidenceOrientationStrip";
import { ProcurementHelpEvidenceOrientationStrip } from "../_sections/ProcurementHelpEvidenceOrientationStrip";
import { EvidenceTrailHelpEvidenceOrientationStrip } from "../_sections/EvidenceTrailHelpEvidenceOrientationStrip";
import { EvidenceIntakeHelpEvidenceOrientationStrip } from "../_sections/EvidenceIntakeHelpEvidenceOrientationStrip";
import { EnterpriseOnboardingHelpEvidenceOrientationStrip } from "../_sections/EnterpriseOnboardingHelpEvidenceOrientationStrip";
import { PilotRoiModelHelpEvidenceOrientationStrip } from "../_sections/PilotRoiModelHelpEvidenceOrientationStrip";
import { HelpDataHandlingTenantIsolationGuideView } from "../_sections/HelpDataHandlingTenantIsolationGuideView";
import { HelpDpaTemplateGuideView } from "../_sections/HelpDpaTemplateGuideView";
import { HelpSoc2SelfAssessmentGuideView } from "../_sections/HelpSoc2SelfAssessmentGuideView";
import { HelpEngineeringTroubleshootingGuideView } from "../_sections/HelpEngineeringTroubleshootingGuideView";
import { HelpFirstReviewEvidenceChecklistGuideView } from "../_sections/HelpFirstReviewEvidenceChecklistGuideView";
import { HelpFirstValue20GuideView } from "../_sections/HelpFirstValue20GuideView";
import { HelpPolicyPackDeltaDemoGuideView } from "../_sections/HelpPolicyPackDeltaDemoGuideView";
import { HelpConnectAzureSecurelyGuideView } from "../_sections/HelpConnectAzureSecurelyGuideView";
import { HelpCorePilotGuideView } from "../_sections/HelpCorePilotGuideView";
import { HelpRepeatReviewLoopGuideView } from "../_sections/HelpRepeatReviewLoopGuideView";
import { HelpSpecialtyWalkthroughTemplatesView } from "../_sections/HelpSpecialtyWalkthroughTemplatesView";
import { HelpGettingStartedGuideView } from "../_sections/HelpGettingStartedGuideView";
import { HelpCloudConnectionsGuideView } from "../_sections/HelpCloudConnectionsGuideView";
import { HelpTopicAuthorityGate } from "../_sections/HelpTopicAuthorityGate";
import { HelpTopicCatchAllEvidenceOrientationStrip } from "../_sections/HelpTopicCatchAllEvidenceOrientationStrip";
import { HelpTopicMarkdownClient } from "../_sections/HelpTopicMarkdownClient";
import { HelpTopicNotFoundView } from "../_sections/HelpTopicNotFoundView";
import { HelpTroubleshootingGuideView } from "../_sections/HelpTroubleshootingGuideView";
import { principalCanAccessHelpTopic } from "@/lib/product-documentation-access";
import { BILLING_AND_PLANS_HELP_ROUTE_METADATA } from "@/lib/billing-and-plans-help-route-metadata";
import { EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA } from "@/lib/executive-summary-help-route-metadata";
import { FINDINGS_HELP_ROUTE_METADATA } from "@/lib/findings-help-route-metadata";
import { CORE_PILOT_HELP_ALIAS_ROUTE_METADATA } from "@/lib/core-pilot-help-alias-route-metadata";
import { FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA } from "@/lib/first-architecture-review-help-route-metadata";
import { GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA } from "@/lib/governance-approval-help-route-metadata";
import { CONFIGURATION_REFERENCE_HELP_ROUTE_METADATA } from "@/lib/configuration-reference-help-route-metadata";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_ROUTE_METADATA } from "@/lib/data-handling-tenant-isolation-help-route-metadata";
import { DPA_TEMPLATE_HELP_ROUTE_METADATA } from "@/lib/dpa-template-help-route-metadata";
import { SOC2_SELF_ASSESSMENT_HELP_ROUTE_METADATA } from "@/lib/soc2-self-assessment-help-route-metadata";
import { FIRST_REVIEW_HELP_ROUTE_METADATA } from "@/lib/first-review-help-route-metadata";
import { POLICY_PACK_DELTA_DEMO_HELP_ROUTE_METADATA } from "@/lib/policy-pack-delta-demo-help-route-metadata";
import { PATH_CHOOSER_HELP_ROUTE_METADATA } from "@/lib/path-chooser-help-route-metadata";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  getProductDocumentationEntry,
  HELP_TOPIC_SLUG_ALIASES,
  listProductDocumentationEntries,
} from "@/lib/product-documentation-registry";
import { getInboundAuthenticatedServerPrincipal } from "@/lib/server-current-principal";

export const dynamic = "force-dynamic";

type HelpTopicPageProps = {
  params: Promise<{ topic: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  const value = searchParams?.[key];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
}

function resolveAzurePermissionsReturnHref(returnTo: string | undefined): string {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.startsWith("/integrations/cloud-connections")) {
    return trimmed;
  }

  return "/integrations/cloud-connections";
}

function helpSlugFromTopicSegments(topic: string[]): string {
  return topic.map((segment) => segment.trim()).filter((segment) => segment.length > 0).join("/");
}

export async function generateStaticParams(): Promise<Array<{ topic: string[] }>> {
  const registryParams = listProductDocumentationEntries()
    .filter((entry) => entry.contentKind !== "internal-runbook")
    .map((entry) => ({ topic: [entry.slug] }));
  const aliasParams = Object.keys(HELP_TOPIC_SLUG_ALIASES).map((alias) => ({
    topic: alias.split("/"),
  }));

  return [...registryParams, ...aliasParams];
}

function renderHelpTopicView(
  loaded: NonNullable<ReturnType<typeof tryLoadProductDocumentation>>,
  searchParams?: Record<string, string | string[] | undefined>,
): React.ReactElement {
  if (loaded.entry.slug === "first-architecture-review") {
    return <HelpCorePilotGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "getting-started") {
    return <HelpGettingStartedGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "cloud-connections") {
    return <HelpCloudConnectionsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "troubleshooting") {
    return <HelpTroubleshootingGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "alerts") {
    return <HelpAlertsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "digests") {
    return <HelpDigestsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "billing-and-plans") {
    return <HelpBillingAndPlansGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "executive-summary") {
    return <HelpExecutiveSummaryGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "findings") {
    return <HelpFindingsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "governance-approval") {
    return <HelpGovernanceApprovalGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "cli-usage") {
    return <HelpCliUsageTechnicalReferenceView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "glossary") {
    return <HelpGlossaryPageView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "users-and-roles") {
    return <HelpUsersAndRolesGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "cloud-connections-azure") {
    return (
      <HelpConnectAzureSecurelyGuideView
        entry={loaded.entry}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }

  if (loaded.entry.slug === "azure-permissions") {
    return (
      <HelpAzurePermissionsGuideView
        entry={loaded.entry}
        subscriptionId={readSearchParam(searchParams, "subscriptionId")}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }

  if (loaded.entry.slug === "specialty-walkthroughs") {
    return <HelpSpecialtyWalkthroughTemplatesView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "repeat-review-loop") {
    return <HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "audit-trail") {
    return <HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "review-packages") {
    return <HelpReviewPackagesGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "review-guide") {
    return <HelpReviewGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "pilot-guide") {
    return <HelpPilotGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "data-handling") {
    return <HelpDataHandlingTenantIsolationGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "dpa-template") {
    return <HelpDpaTemplateGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "soc2-self-assessment") {
    return <HelpSoc2SelfAssessmentGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "policy-pack-delta-demo") {
    return <HelpPolicyPackDeltaDemoGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "configuration-reference") {
    return <HelpConfigurationReferenceGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "first-review") {
    return <HelpFirstReviewEvidenceChecklistGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "first-value-20-minutes") {
    return <HelpFirstValue20GuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "developer-troubleshooting") {
    return <HelpEngineeringTroubleshootingGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "governance-api-contracts") {
    return <HelpApiContractsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "security-trust") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<SecurityTrustHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "accelerator-chooser") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<AcceleratorChooserHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "admin-diagnostics") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<AdminDiagnosticsHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "authentication-sign-in") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<AuthenticationSignInHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "azure-boards") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<AzureBoardsHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "caiq-sig-response") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<CaiqSigResponseHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "scope") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<ScopeHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "procurement") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<ProcurementHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "evidence-trail") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<EvidenceTrailHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "evidence-intake") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<EvidenceIntakeHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "enterprise-onboarding") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<EnterpriseOnboardingHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "pilot-roi-model") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<PilotRoiModelHelpEvidenceOrientationStrip />}
      />
    );
  }

  return (
    <HelpTopicMarkdownView
      entry={loaded.entry}
      markdown={loaded.markdown}
      showContextualHelp
      evidenceOrientation={<HelpTopicCatchAllEvidenceOrientationStrip />}
    />
  );
}

export async function generateMetadata(props: HelpTopicPageProps): Promise<Metadata> {
  const { topic } = await props.params;
  const entry = getProductDocumentationEntry(helpSlugFromTopicSegments(topic));

  if (entry === null) {
    return { title: "Help topic not found" };
  }

  if (entry.contentKind === "internal-runbook") {
    return { title: "Help topic not found" };
  }

  if (entry.slug === "first-architecture-review") {
    return FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA;
  }

  if (helpSlugFromTopicSegments(topic) === "core-pilot") {
    return CORE_PILOT_HELP_ALIAS_ROUTE_METADATA;
  }

  if (entry.slug === "billing-and-plans") {
    return BILLING_AND_PLANS_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "executive-summary") {
    return EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "findings") {
    return FINDINGS_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "governance-approval") {
    return GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "path-chooser") {
    return PATH_CHOOSER_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "data-handling") {
    return DATA_HANDLING_TENANT_ISOLATION_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "dpa-template") {
    return DPA_TEMPLATE_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "soc2-self-assessment") {
    return SOC2_SELF_ASSESSMENT_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "policy-pack-delta-demo") {
    return POLICY_PACK_DELTA_DEMO_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "configuration-reference") {
    return CONFIGURATION_REFERENCE_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "first-review") {
    return FIRST_REVIEW_HELP_ROUTE_METADATA;
  }

  return {
    title: entry.title,
    description: entry.summary,
  };
}

export default async function HelpTopicPage(props: HelpTopicPageProps): Promise<React.ReactElement> {
  const { topic } = await props.params;
  const resolvedSearchParams = props.searchParams !== undefined ? await props.searchParams : undefined;
  const slug = helpSlugFromTopicSegments(topic);
  const entry = getProductDocumentationEntry(slug);

  if (entry === null) {
    notFound();
  }

  if (entry.contentKind === "internal-runbook") {
    const inboundAuthorization = (await headers()).get("authorization")?.trim() ?? "";

    if (inboundAuthorization.length > 0) {
      const principal = await getInboundAuthenticatedServerPrincipal();

      if (!principalCanAccessHelpTopic(entry, principal)) {
        notFound();
      }

      const loaded = tryLoadProductDocumentation(slug);

      if (loaded === null) {
        notFound();
      }

      return (
        <HelpTopicAuthorityGate entry={entry} denied={<HelpTopicNotFoundView />}>
          {renderHelpTopicView(loaded, resolvedSearchParams)}
        </HelpTopicAuthorityGate>
      );
    }

    return (
      <HelpTopicAuthorityGate entry={entry} denied={<HelpTopicNotFoundView />}>
        <HelpTopicMarkdownClient entry={entry} />
      </HelpTopicAuthorityGate>
    );
  }

  const loaded = tryLoadProductDocumentation(slug);

  if (loaded === null) {
    notFound();
  }

  return renderHelpTopicView(loaded, resolvedSearchParams);
}
