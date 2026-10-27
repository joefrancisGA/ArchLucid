using ArchLucid.Application.Manifests;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.AgentEvaluation;

using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Analysis;

internal static partial class ConsultingDocxSupplementalSections
{
    public static void AddArchitectureDetails(Body body, ArchitectureAnalysisReport report)
    {
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Architecture Details", 1);

        if (report.Manifest is null)
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, "No manifest was available for this run.",
                "BodyText");

            return;
        }

        if (report.Manifest.Services.Count > 0)
        {
            ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Services", 2);

            foreach (ManifestService service in report.Manifest.Services.OrderBy(x => x.ServiceName))
            {
                string serviceName = string.IsNullOrWhiteSpace(service.ServiceName)
                    ? ConsultingDocxGovernanceHonestyCopy.ServiceNameNotStored
                    : service.ServiceName.Trim();
                ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, serviceName, "Strong");
                ConsultingDocxOpenXmlPrimitives.AddBullet(
                    body,
                    $"Type: {FormatConsultingServiceType(service.ServiceType)}");
                ConsultingDocxOpenXmlPrimitives.AddBullet(
                    body,
                    $"Platform: {FormatConsultingRuntimePlatform(service.RuntimePlatform)}");
                ConsultingDocxOpenXmlPrimitives.AddBullet(
                    body,
                    $"Purpose: {(string.IsNullOrWhiteSpace(service.Purpose) ? ConsultingDocxGovernanceHonestyCopy.ServicePurposeNotStored : service.Purpose.Trim())}");

                ConsultingDocxOpenXmlPrimitives.AddBullet(
                    body,
                    service.RequiredControls.Count > 0
                        ? $"Required Controls: {string.Join(", ", service.RequiredControls)}"
                        : $"Required Controls: {ConsultingDocxGovernanceHonestyCopy.ServiceRequiredControlsNotStored}");

                ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
            }
        }

        if (report.Manifest.Datastores.Count > 0)
        {
            ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Datastores", 2);

            foreach (ManifestDatastore datastore in report.Manifest.Datastores.OrderBy(x => x.DatastoreName))
            {
                string datastoreName = string.IsNullOrWhiteSpace(datastore.DatastoreName)
                    ? ConsultingDocxGovernanceHonestyCopy.DatastoreNameNotStored
                    : datastore.DatastoreName.Trim();
                ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, datastoreName, "Strong");
                ConsultingDocxOpenXmlPrimitives.AddBullet(
                    body,
                    $"Type: {ArchitectureManifestTopologyExport.FormatDatastoreTypeForExport(datastore.DatastoreType)}");
                ConsultingDocxOpenXmlPrimitives.AddBullet(
                    body,
                    $"Platform: {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(datastore.RuntimePlatform)}");
                ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                    $"Private Endpoint Required: {ArchitectureManifestDatastoreExport.FormatPrivateEndpointRequiredForExport(datastore.PrivateEndpointRequired)}");
                ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                    $"Encryption At Rest Required: {ArchitectureManifestDatastoreExport.FormatEncryptionAtRestRequiredForExport(datastore.EncryptionAtRestRequired)}");
                ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
            }
        }

        if (report.Manifest.Relationships.Count <= 0)
            return;

        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Relationships", 2);

        foreach (ManifestRelationship relationship in report.Manifest.Relationships
                     .OrderBy(x => x.SourceId)
                     .ThenBy(x => x.TargetId))
        {
            string sourceLabel = FormatConsultingRelationshipEndpoint(
                relationship.SourceId,
                report.Manifest);
            string targetLabel = FormatConsultingRelationshipEndpoint(
                relationship.TargetId,
                report.Manifest);
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                $"{sourceLabel} {relationship.RelationshipType} {targetLabel}",
                "Strong");

            string description = string.IsNullOrWhiteSpace(relationship.Description)
                ? ConsultingDocxGovernanceHonestyCopy.RelationshipDescriptionNotStored
                : relationship.Description.Trim();
            ConsultingDocxOpenXmlPrimitives.AddBullet(body, description);

            ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
        }
    }

    public static void AddGovernanceAndControls(Body body, ArchitectureAnalysisReport report)
    {
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Governance and Controls", 1);

        if (report.Manifest is null)
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, "No manifest was available for this run.",
                "BodyText");

            return;
        }

        ManifestGovernance gov = report.Manifest.Governance;

        ConsultingDocxOpenXmlPrimitives.AddKeyValueTable(body, [
            ("Risk Classification", ArchitectureManifestGovernanceExport.FormatRiskClassificationForExport(gov)),
            ("Cost Classification", ArchitectureManifestGovernanceExport.FormatCostClassificationForExport(gov)),
            ("Required Controls", FormatConsultingGovernanceList(gov.RequiredControls, ConsultingDocxGovernanceHonestyCopy.RequiredControlsNotStored)),
            ("Compliance Tags", FormatConsultingGovernanceList(gov.ComplianceTags, ConsultingDocxGovernanceHonestyCopy.ComplianceTagsNotStored)),
            ("Policy Constraints", FormatConsultingGovernanceList(gov.PolicyConstraints, ConsultingDocxGovernanceHonestyCopy.PolicyConstraintsNotStored))
        ]);
    }

    private static string FormatConsultingRelationshipEndpoint(string componentId, GoldenManifest manifest)
    {
        if (string.IsNullOrWhiteSpace(componentId))
            return "Component id was not stored.";

        string resolved = ManifestPresentation.ResolveComponentName(componentId, manifest).Trim();

        return resolved.Length > 0 ? resolved : componentId.Trim();
    }

    private static string FormatConsultingGovernanceList(IReadOnlyList<string> items, string emptyCopy) =>
        items.Count > 0 ? string.Join(", ", items) : emptyCopy;

    private static string FormatConsultingServiceType(ServiceType serviceType) =>
        serviceType == ServiceType.Unknown
            ? ConsultingDocxGovernanceHonestyCopy.ServiceTypeNotStored
            : serviceType.ToString();

    private static string FormatConsultingRuntimePlatform(RuntimePlatform runtimePlatform) =>
        runtimePlatform == RuntimePlatform.Unknown
            ? ConsultingDocxGovernanceHonestyCopy.RuntimePlatformNotStored
            : runtimePlatform.ToString();

    public static void AddExplainabilitySection(
        Body body,
        ArchitectureAnalysisReport report,
        ConsultingDocxTemplateOptions options)
    {
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Explainability and Execution Review", 1);

        if (report.ExecutionTraces.Count == 0)
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, "No execution traces were available for this run.",
                "BodyText");

            return;
        }

        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
            body,
            "This section summarizes the agent execution path and highlights the available trace information.",
            "BodyText");

        ConsultingDocxOpenXmlPrimitives.AddBullet(body, $"Execution Trace Count: {report.ExecutionTraces.Count}");

        IOrderedEnumerable<IGrouping<AgentType, AgentExecutionTrace>> grouped = report.ExecutionTraces
            .GroupBy(x => x.AgentType)
            .OrderBy(x => x.Key);

        foreach (IGrouping<AgentType, AgentExecutionTrace> group in grouped)
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, group.Key.ToString(), "Strong");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body, $"Trace Count: {group.Count()}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(
                body,
                $"Latest Parse Success: {(group.OrderByDescending(x => x.CreatedUtc).First().ParseSucceeded ? "Succeeded" : "Failed")}");
        }

        if (report.Determinism is not null)
        {
            ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, "Determinism Snapshot", "Strong");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body, $"Iterations: {report.Determinism.Iterations}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Is Deterministic: {(report.Determinism.IsDeterministic ? "Yes" : "No")}");
        }

        if (report.ManifestDiff is null && report.AgentResultDiff is null)
            return;

        ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
        ConsultingDocxOpenXmlPrimitives.AddCallout(
            body,
            "Comparison artifacts were included in this report. See Appendix C for detail.",
            options);
    }
}
