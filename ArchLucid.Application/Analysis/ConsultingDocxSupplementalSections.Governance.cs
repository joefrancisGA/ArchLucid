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
                ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, service.ServiceName, "Strong");
                ConsultingDocxOpenXmlPrimitives.AddBullet(body, $"Type: {service.ServiceType}");
                ConsultingDocxOpenXmlPrimitives.AddBullet(body, $"Platform: {service.RuntimePlatform}");

                if (!string.IsNullOrWhiteSpace(service.Purpose))

                    ConsultingDocxOpenXmlPrimitives.AddBullet(body, $"Purpose: {service.Purpose}");

                if (service.RequiredControls.Count > 0)

                    ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                        $"Required Controls: {string.Join(", ", service.RequiredControls)}");

                ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
            }
        }

        if (report.Manifest.Datastores.Count > 0)
        {
            ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Datastores", 2);

            foreach (ManifestDatastore datastore in report.Manifest.Datastores.OrderBy(x => x.DatastoreName))
            {
                ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, datastore.DatastoreName, "Strong");
                ConsultingDocxOpenXmlPrimitives.AddBullet(body, $"Type: {datastore.DatastoreType}");
                ConsultingDocxOpenXmlPrimitives.AddBullet(body, $"Platform: {datastore.RuntimePlatform}");
                ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                    $"Private Endpoint Required: {(datastore.PrivateEndpointRequired ? "Yes" : "No")}");
                ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                    $"Encryption At Rest Required: {(datastore.EncryptionAtRestRequired ? "Yes" : "No")}");
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
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                $"{relationship.SourceId} {relationship.RelationshipType} {relationship.TargetId}",
                "Strong");

            if (!string.IsNullOrWhiteSpace(relationship.Description))

                ConsultingDocxOpenXmlPrimitives.AddBullet(body, relationship.Description);

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
            ("Risk Classification", gov.RiskClassification),
            ("Cost Classification", gov.CostClassification),
            ("Required Controls", gov.RequiredControls.Count > 0 ? string.Join(", ", gov.RequiredControls) : "None"),
            ("Compliance Tags", gov.ComplianceTags.Count > 0 ? string.Join(", ", gov.ComplianceTags) : "None"),
            ("Policy Constraints", gov.PolicyConstraints.Count > 0 ? string.Join(", ", gov.PolicyConstraints) : "None")
        ]);
    }

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
