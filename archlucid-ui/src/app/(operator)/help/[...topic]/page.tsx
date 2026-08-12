import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

import { HelpTopicMarkdownView } from "../HelpTopicMarkdownView";
import { CaiqSigResponseHelpEvidenceOrientationStrip } from "@/components/help/CaiqSigResponseHelpEvidenceOrientationStrip";
import { ScopeHelpCurrentScopePanel } from "@/components/help/ScopeHelpCurrentScopePanel";
import { ScopeHelpEvidenceOrientationStrip } from "@/components/help/ScopeHelpEvidenceOrientationStrip";
import { IntegrationReadinessHelpEvidenceOrientationStrip } from "@/components/help/IntegrationReadinessHelpEvidenceOrientationStrip";
import { AuthenticationSignInHelpEvidenceOrientationStrip } from "@/components/help/AuthenticationSignInHelpEvidenceOrientationStrip";
import { SecurityTrustHelpEvidenceOrientationStrip } from "@/components/help/SecurityTrustHelpEvidenceOrientationStrip";
import { SubprocessorsHelpEvidenceOrientationStrip } from "@/components/help/SubprocessorsHelpEvidenceOrientationStrip";
import { ReportProblemHelpOrientationStack } from "@/components/help/ReportProblemHelpOrientationStack";
import { HelpSubprocessorsHeaderMetadata } from "@/app/(operator)/help/_sections/HelpSubprocessorsHeaderMetadata";
import { HelpTopicAuthorityGate } from "../_sections/HelpTopicAuthorityGate";
import { HelpTopicMarkdownClient } from "../_sections/HelpTopicMarkdownClient";
import { HelpTopicNotFoundView } from "../_sections/HelpTopicNotFoundView";
import { principalCanAccessHelpTopic } from "@/lib/product-documentation-access";
import { BILLING_AND_PLANS_HELP_ROUTE_METADATA } from "@/lib/billing-and-plans-help-route-metadata";
import { EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA } from "@/lib/executive/executive-summary-help-route-metadata";
import { FINDINGS_HELP_ROUTE_METADATA } from "@/lib/findings/findings-help-route-metadata";
import { FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA } from "@/lib/first-architecture-review-help-route-metadata";
import { GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA } from "@/lib/governance/governance-approval-help-route-metadata";
import { CONFIGURATION_REFERENCE_HELP_ROUTE_METADATA } from "@/lib/configuration-reference-help-route-metadata";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_ROUTE_METADATA } from "@/lib/data-handling-tenant-isolation-help-route-metadata";
import { DPA_TEMPLATE_HELP_ROUTE_METADATA } from "@/lib/dpa-template-help-route-metadata";
import { SOC2_SELF_ASSESSMENT_HELP_ROUTE_METADATA } from "@/lib/soc2-self-assessment-help-route-metadata";
import { ACCELERATOR_CHOOSER_HELP_ROUTE_METADATA } from "@/lib/accelerator-chooser-help-route-metadata";
import { PATH_CHOOSER_HELP_ROUTE_METADATA } from "@/lib/path-chooser-help-route-metadata";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_SEGMENTS } from "@/lib/cloud-connections-help-routes";
import {
  getProductDocumentationEntry,
  listProductDocumentationEntries,
} from "@/lib/product-documentation-registry";
import { HELP_TOPIC_PERMANENT_REDIRECTS } from "@/lib/help/help-topic-permanent-redirects";
import { getInboundAuthenticatedServerPrincipal } from "@/lib/server-current-principal";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";
import { resolveInternalRunbookHelpRouteMetadata } from "@/lib/resolve-internal-runbook-help-route-metadata";

export const revalidate = 3600;

const HelpAcceleratorChooserGuideView = dynamic(() =>
  import("../_sections/HelpAcceleratorChooserGuideView").then((module) => module.HelpAcceleratorChooserGuideView),
);
const HelpAlertsGuideView = dynamic(() =>
  import("../_sections/HelpAlertsGuideView").then((module) => module.HelpAlertsGuideView),
);
const HelpDigestsGuideView = dynamic(() =>
  import("../_sections/HelpDigestsGuideView").then((module) => module.HelpDigestsGuideView),
);
const HelpAdminDiagnosticsGuideView = dynamic(() =>
  import("../_sections/HelpAdminDiagnosticsGuideView").then((module) => module.HelpAdminDiagnosticsGuideView),
);
const HelpApiContractsGuideView = dynamic(() =>
  import("../_sections/HelpApiContractsGuideView").then((module) => module.HelpApiContractsGuideView),
);
const HelpBillingAndPlansGuideView = dynamic(() =>
  import("../_sections/HelpBillingAndPlansGuideView").then((module) => module.HelpBillingAndPlansGuideView),
);
const HelpExecutiveSummaryGuideView = dynamic(() =>
  import("../_sections/HelpExecutiveSummaryGuideView").then((module) => module.HelpExecutiveSummaryGuideView),
);
const HelpFindingsGuideView = dynamic(() =>
  import("../_sections/HelpFindingsGuideView").then((module) => module.HelpFindingsGuideView),
);
const HelpGlossaryPageView = dynamic(() =>
  import("../_sections/HelpGlossaryPageView").then((module) => module.HelpGlossaryPageView),
);
const HelpUsersAndRolesGuideView = dynamic(() =>
  import("../_sections/HelpUsersAndRolesGuideView").then((module) => module.HelpUsersAndRolesGuideView),
);
const HelpCliUsageTechnicalReferenceView = dynamic(() =>
  import("../_sections/HelpCliUsageTechnicalReferenceView").then(
    (module) => module.HelpCliUsageTechnicalReferenceView,
  ),
);
const HelpGovernanceApprovalGuideView = dynamic(() =>
  import("../_sections/HelpGovernanceApprovalGuideView").then((module) => module.HelpGovernanceApprovalGuideView),
);
const HelpAzurePermissionsGuideView = dynamic(() =>
  import("../_sections/HelpAzurePermissionsGuideView").then((module) => module.HelpAzurePermissionsGuideView),
);
const HelpAuditTrailGuideView = dynamic(() =>
  import("../_sections/HelpAuditTrailGuideView").then((module) => module.HelpAuditTrailGuideView),
);
const HelpReviewPackagesGuideView = dynamic(() =>
  import("../_sections/HelpReviewPackagesGuideView").then((module) => module.HelpReviewPackagesGuideView),
);
const HelpReviewGuideView = dynamic(() =>
  import("../_sections/HelpReviewGuideView").then((module) => module.HelpReviewGuideView),
);
const HelpProcurementGuideView = dynamic(() =>
  import("../_sections/HelpProcurementGuideView").then((module) => module.HelpProcurementGuideView),
);
const HelpPilotGuideView = dynamic(() =>
  import("../_sections/HelpPilotGuideView").then((module) => module.HelpPilotGuideView),
);
const HelpPolicyPackDeltaDemoGuideView = dynamic(() =>
  import("../_sections/HelpPolicyPackDeltaDemoGuideView").then(
    (module) => module.HelpPolicyPackDeltaDemoGuideView,
  ),
);
const HelpPilotFeedbackGuideView = dynamic(() =>
  import("../_sections/HelpPilotFeedbackGuideView").then((module) => module.HelpPilotFeedbackGuideView),
);
const HelpConfigurationReferenceGuideView = dynamic(() =>
  import("../_sections/HelpConfigurationReferenceGuideView").then(
    (module) => module.HelpConfigurationReferenceGuideView,
  ),
);
const HelpDataHandlingTenantIsolationGuideView = dynamic(() =>
  import("../_sections/HelpDataHandlingTenantIsolationGuideView").then(
    (module) => module.HelpDataHandlingTenantIsolationGuideView,
  ),
);
const HelpDpaTemplateGuideView = dynamic(() =>
  import("../_sections/HelpDpaTemplateGuideView").then((module) => module.HelpDpaTemplateGuideView),
);
const HelpSoc2SelfAssessmentGuideView = dynamic(() =>
  import("../_sections/HelpSoc2SelfAssessmentGuideView").then((module) => module.HelpSoc2SelfAssessmentGuideView),
);
const HelpEngineeringTroubleshootingGuideView = dynamic(() =>
  import("../_sections/HelpEngineeringTroubleshootingGuideView").then(
    (module) => module.HelpEngineeringTroubleshootingGuideView,
  ),
);
const HelpEnterpriseOnboardingGuideView = dynamic(() =>
  import("../_sections/HelpEnterpriseOnboardingGuideView").then(
    (module) => module.HelpEnterpriseOnboardingGuideView,
  ),
);
const HelpEvidenceIntakeGuideView = dynamic(() =>
  import("../_sections/HelpEvidenceIntakeGuideView").then((module) => module.HelpEvidenceIntakeGuideView),
);
const HelpEvidenceTrailGuideView = dynamic(() =>
  import("../_sections/HelpEvidenceTrailGuideView").then((module) => module.HelpEvidenceTrailGuideView),
);
const HelpPolicyPacksGuideView = dynamic(() =>
  import("../_sections/HelpPolicyPacksGuideView").then((module) => module.HelpPolicyPacksGuideView),
);
const HelpConnectAzureSecurelyGuideView = dynamic(() =>
  import("../_sections/HelpConnectAzureSecurelyGuideView").then((module) => module.HelpConnectAzureSecurelyGuideView),
);
const HelpConnectAwsSecurelyGuideView = dynamic(() =>
  import("../_sections/HelpConnectAwsSecurelyGuideView").then((module) => module.HelpConnectAwsSecurelyGuideView),
);
const HelpConnectGcpSecurelyGuideView = dynamic(() =>
  import("../_sections/HelpConnectGcpSecurelyGuideView").then((module) => module.HelpConnectGcpSecurelyGuideView),
);
const HelpCorePilotGuideView = dynamic(() =>
  import("../_sections/HelpCorePilotGuideView").then((module) => module.HelpCorePilotGuideView),
);
const HelpComparisonReplayGuideView = dynamic(() =>
  import("../_sections/HelpComparisonReplayGuideView").then((module) => module.HelpComparisonReplayGuideView),
);
const HelpRepeatReviewLoopGuideView = dynamic(() =>
  import("../_sections/HelpRepeatReviewLoopGuideView").then((module) => module.HelpRepeatReviewLoopGuideView),
);
const HelpSpecialtyWalkthroughTemplatesView = dynamic(() =>
  import("../_sections/HelpSpecialtyWalkthroughTemplatesView").then(
    (module) => module.HelpSpecialtyWalkthroughTemplatesView,
  ),
);
const HelpGettingStartedGuideView = dynamic(() =>
  import("../_sections/HelpGettingStartedGuideView").then((module) => module.HelpGettingStartedGuideView),
);
const HelpCloudConnectionsGuideView = dynamic(() =>
  import("../_sections/HelpCloudConnectionsGuideView").then((module) => module.HelpCloudConnectionsGuideView),
);
const HelpAzureBoardsGuideView = dynamic(() =>
  import("../_sections/HelpAzureBoardsGuideView").then((module) => module.HelpAzureBoardsGuideView),
);
const HelpTroubleshootingGuideView = dynamic(() =>
  import("../_sections/HelpTroubleshootingGuideView").then((module) => module.HelpTroubleshootingGuideView),
);

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
  const cloudHelpParams = CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_SEGMENTS.map((segment) => ({
    topic: segment.split("/"),
  }));
  const retiredSlugParams = Object.keys(HELP_TOPIC_PERMANENT_REDIRECTS).map((slug) => ({
    topic: slug.split("/"),
  }));

  return [...registryParams, ...cloudHelpParams, ...retiredSlugParams];
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

  if (loaded.entry.slug === "cloud-connections-aws") {
    return (
      <HelpConnectAwsSecurelyGuideView
        entry={loaded.entry}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }

  if (loaded.entry.slug === "cloud-connections-gcp") {
    return <HelpConnectGcpSecurelyGuideView entry={loaded.entry} />;
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

  if (loaded.entry.slug === "configuration-reference") {
    return <HelpConfigurationReferenceGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "enterprise-onboarding") {
    return <HelpEnterpriseOnboardingGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "evidence-intake") {
    return <HelpEvidenceIntakeGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "engineering-troubleshooting") {
    return <HelpEngineeringTroubleshootingGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "api-contracts") {
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
    return <HelpAcceleratorChooserGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "admin-diagnostics") {
    return <HelpAdminDiagnosticsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
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
    return <HelpAzureBoardsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "policy-packs") {
    return <HelpPolicyPacksGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "policy-pack-delta-demo") {
    return <HelpPolicyPackDeltaDemoGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "prior-manifest-retrieval") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
      />
    );
  }

  if (loaded.entry.slug === "report-a-problem") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<ReportProblemHelpOrientationStack />}
      />
    );
  }

  if (loaded.entry.slug === "subprocessors") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        titleBlockOrientation={<HelpSubprocessorsHeaderMetadata entry={loaded.entry} />}
        evidenceOrientation={<SubprocessorsHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "integration-readiness") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<IntegrationReadinessHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "pilot-feedback") {
    return <HelpPilotFeedbackGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "caiq-sig-response") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<CaiqSigResponseHelpEvidenceOrientationStrip />}
        layoutVariant="technicalReference"
        showExportClaimDiscipline
      />
    );
  }

  if (loaded.entry.slug === "comparison-replay") {
    return <HelpComparisonReplayGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "scope") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={
          <>
            <ScopeHelpEvidenceOrientationStrip />
            <ScopeHelpCurrentScopePanel />
          </>
        }
      />
    );
  }

  if (loaded.entry.slug === "procurement") {
    return <HelpProcurementGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "evidence-trail") {
    return <HelpEvidenceTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  return (
    <HelpTopicMarkdownView
      entry={loaded.entry}
      markdown={loaded.markdown}
      showContextualHelp
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
    return resolveInternalRunbookHelpRouteMetadata(entry);
  }

  if (entry.slug === "first-architecture-review") {
    return FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA;
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

  if (entry.slug === "choose-your-next-step") {
    return PATH_CHOOSER_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "accelerator-chooser") {
    return ACCELERATOR_CHOOSER_HELP_ROUTE_METADATA;
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

  if (entry.slug === "configuration-reference") {
    return CONFIGURATION_REFERENCE_HELP_ROUTE_METADATA;
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
  const permanentRedirectTarget = resolveHelpTopicPermanentRedirect(slug);

  if (permanentRedirectTarget !== null) {
    permanentRedirect(permanentRedirectTarget);
  }

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
