using System.Text;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Manifests;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Summaries;

/// <summary>
///     Generates a narrative Markdown summary of a <see cref = "GoldenManifest"/>, optionally followed
///     by an evidence context section when an <see cref = "AgentEvidencePackage"/> is supplied.
///     Intended for LLM-facing and export-facing surfaces.
/// </summary>
public sealed class MarkdownManifestSummaryGenerator(IEvidenceSummaryFormatter evidenceFormatter) : IManifestSummaryGenerator
{
    private readonly IEvidenceSummaryFormatter _evidenceFormatter = evidenceFormatter ?? throw new ArgumentNullException(nameof(evidenceFormatter));

    /// <inheritdoc/>
    public string GenerateMarkdown(GoldenManifest manifest, AgentEvidencePackage? evidence = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        List<ManifestService> services = manifest.Services;
        List<ManifestDatastore> datastores = manifest.Datastores;
        List<ManifestRelationship> relationships = manifest.Relationships;
        StringBuilder sb = new();
        AppendOverview(sb, manifest, services, datastores, relationships);
        AppendServices(sb, services);
        AppendDatastores(sb, datastores);
        AppendRelationships(sb, relationships);
        AppendGovernance(sb, manifest.Governance);
        AppendMetadata(sb, manifest.Metadata);
        if (evidence is null)
            return sb.ToString();
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine(_evidenceFormatter.FormatMarkdown(evidence).Trim());
        sb.AppendLine();
        return sb.ToString();
    }

    private static void AppendOverview(StringBuilder sb, GoldenManifest manifest, IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores, IReadOnlyList<ManifestRelationship> relationships)
    {
        string systemName = ArchitectureManifestMarkdownSummaryExport.FormatSystemNameForSummary(manifest.SystemName);
        sb.AppendLine($"# Architecture Summary: {systemName}");
        sb.AppendLine();
        sb.AppendLine("## Overview");
        sb.AppendLine();
        sb.AppendLine($"{systemName} is represented by a GoldenManifest containing " +
                      $"{services.Count} service(s), {datastores.Count} datastore(s), " + $"and {relationships.Count} relationship(s).");
        sb.AppendLine();
    }

    private static void AppendServices(StringBuilder sb, IReadOnlyList<ManifestService> services)
    {
        if (services.Count == 0)
            return;
        sb.AppendLine("## Services");
        sb.AppendLine();
        foreach (ManifestService service in services.OrderBy(s => s.ServiceName))
        {
            sb.AppendLine($"- **{service.ServiceName}**");
            sb.AppendLine($"  - Type: {ArchitectureManifestTopologyExport.FormatServiceTypeForExport(service.ServiceType)}");
            sb.AppendLine($"  - Platform: {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(service.RuntimePlatform)}");
            sb.AppendLine(
                string.IsNullOrWhiteSpace(service.Purpose)
                    ? $"  - Purpose: {ArchitectureManifestMarkdownSummaryExport.PurposeNotRecorded}"
                    : $"  - Purpose: {service.Purpose}");
            List<string> controls = service.RequiredControls;
            if (controls.Count > 0)
                sb.AppendLine($"  - Required Controls: {string.Join(", ", controls)}");
            List<string> tags = service.Tags;
            if (tags.Count > 0)
                sb.AppendLine($"  - Tags: {string.Join(", ", tags)}");
        }

        sb.AppendLine();
    }

    private static void AppendDatastores(StringBuilder sb, IReadOnlyList<ManifestDatastore> datastores)
    {
        if (datastores.Count == 0)
            return;
        sb.AppendLine("## Datastores");
        sb.AppendLine();
        foreach (ManifestDatastore datastore in datastores.OrderBy(d => d.DatastoreName))
        {
            sb.AppendLine($"- **{datastore.DatastoreName}**");
            sb.AppendLine($"  - Type: {ArchitectureManifestTopologyExport.FormatDatastoreTypeForExport(datastore.DatastoreType)}");
            sb.AppendLine($"  - Platform: {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(datastore.RuntimePlatform)}");
            sb.AppendLine(
                string.IsNullOrWhiteSpace(datastore.Purpose)
                    ? $"  - Purpose: {ArchitectureManifestMarkdownSummaryExport.PurposeNotRecorded}"
                    : $"  - Purpose: {datastore.Purpose}");
            sb.AppendLine($"  - Private Endpoint Required: {ArchitectureManifestDatastoreExport.FormatPrivateEndpointRequiredForExport(datastore.PrivateEndpointRequired)}");
            sb.AppendLine($"  - Encryption At Rest Required: {ArchitectureManifestDatastoreExport.FormatEncryptionAtRestRequiredForExport(datastore.EncryptionAtRestRequired)}");
        }

        sb.AppendLine();
    }

    private static void AppendRelationships(StringBuilder sb, IReadOnlyList<ManifestRelationship> relationships)
    {
        if (relationships.Count == 0)
            return;
        sb.AppendLine("## Relationships");
        sb.AppendLine();
        foreach (ManifestRelationship r in relationships.OrderBy(r => r.SourceId).ThenBy(r => r.TargetId))
        {
            sb.AppendLine($"- **{r.SourceId}** {FormatRelationshipType(r)} **{r.TargetId}**");
            if (!string.IsNullOrWhiteSpace(r.Description))
                sb.AppendLine($"  - {r.Description}");
        }

        sb.AppendLine();
    }

    private static void AppendGovernance(StringBuilder sb, ManifestGovernance? governance)
    {
        sb.AppendLine("## Governance");
        sb.AppendLine();
        if (governance is null)
        {
            sb.AppendLine($"- Required Controls: {ArchitectureManifestGovernanceExport.RequiredControlsNotStoredLabel}");
            sb.AppendLine($"- Compliance Tags: {ArchitectureManifestGovernanceExport.ComplianceTagsNotStoredLabel}");
            sb.AppendLine($"- Policy Constraints: {ArchitectureManifestGovernanceExport.PolicyConstraintsNotStoredLabel}");
            sb.AppendLine($"- Risk Classification: {ArchitectureManifestGovernanceExport.RiskClassificationNotStoredLabel}");
            sb.AppendLine($"- Cost Classification: {ArchitectureManifestGovernanceExport.CostClassificationNotStoredLabel}");
            sb.AppendLine();
            return;
        }

        sb.AppendLine($"- Required Controls: {ArchitectureManifestGovernanceExport.FormatRequiredControlsForExport(governance.RequiredControls)}");
        sb.AppendLine($"- Compliance Tags: {ArchitectureManifestGovernanceExport.FormatComplianceTagsForExport(governance.ComplianceTags)}");
        sb.AppendLine($"- Policy Constraints: {ArchitectureManifestGovernanceExport.FormatPolicyConstraintsForExport(governance.PolicyConstraints)}");
        sb.AppendLine($"- Risk Classification: {ArchitectureManifestGovernanceExport.FormatRiskClassificationForExport(governance)}");
        sb.AppendLine($"- Cost Classification: {ArchitectureManifestGovernanceExport.FormatCostClassificationForExport(governance)}");
        sb.AppendLine();
    }

    private static void AppendMetadata(StringBuilder sb, ManifestMetadata? metadata)
    {
        sb.AppendLine("## Metadata");
        sb.AppendLine();
        string manifestVersion = string.IsNullOrWhiteSpace(metadata?.ManifestVersion)
            ? ArchitectureManifestMarkdownSummaryExport.ManifestVersionNotStored
            : metadata!.ManifestVersion;
        sb.AppendLine($"- Manifest Version: {manifestVersion}");
        if (!string.IsNullOrWhiteSpace(metadata?.ParentManifestVersion))
            sb.AppendLine($"- Parent Manifest Version: {metadata.ParentManifestVersion}");
        if (!string.IsNullOrWhiteSpace(metadata?.ChangeDescription))
            sb.AppendLine($"- Change Description: {metadata.ChangeDescription}");
        if (metadata is not null)
            sb.AppendLine($"- Created UTC: {metadata.CreatedUtc:O}");
        List<string> traceIds = metadata?.DecisionTraceIds ?? [];
        if (traceIds.Count > 0)
            sb.AppendLine($"- Decision Trace Count: {traceIds.Count}");
    }

    private static string FormatRelationshipType(ManifestRelationship relationship) =>
        ArchitectureManifestMarkdownSummaryExport.FormatRelationshipTypeForSummary(relationship.RelationshipType);
}
