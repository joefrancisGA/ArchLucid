using System.Text;

using ArchiForge.Application.Evidence;
using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Common;
using ArchiForge.Contracts.Manifest;

namespace ArchiForge.Application.Summaries;

/// <summary>
/// Generates a narrative Markdown summary of a <see cref="GoldenManifest"/>, optionally followed
/// by an evidence context section when an <see cref="AgentEvidencePackage"/> is supplied.
/// Intended for LLM-facing and export-facing surfaces.
/// </summary>
public sealed class MarkdownManifestSummaryGenerator(IEvidenceSummaryFormatter evidenceFormatter)
    : IManifestSummaryGenerator
{
    /// <inheritdoc />
    public string GenerateMarkdown(
        GoldenManifest manifest,
        AgentEvidencePackage? evidence = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        var sb = new StringBuilder();

        var services = manifest.Services ?? [];
        var datastores = manifest.Datastores ?? [];
        var relationships = manifest.Relationships ?? [];

        sb.AppendLine($"# Architecture Summary: {manifest.SystemName}");
        sb.AppendLine();

        sb.AppendLine("## Overview");
        sb.AppendLine();
        sb.AppendLine(
            $"{manifest.SystemName} is represented by a GoldenManifest containing " +
            $"{services.Count} service(s), {datastores.Count} datastore(s), " +
            $"and {relationships.Count} relationship(s).");
        sb.AppendLine();

        if (services.Count > 0)
        {
            sb.AppendLine("## Services");
            sb.AppendLine();

            foreach (var service in services.OrderBy(s => s.ServiceName))
            {
                sb.AppendLine($"- **{service.ServiceName}**");
                sb.AppendLine($"  - Type: {service.ServiceType}");
                sb.AppendLine($"  - Platform: {service.RuntimePlatform}");

                if (!string.IsNullOrWhiteSpace(service.Purpose))
                {
                    sb.AppendLine($"  - Purpose: {service.Purpose}");
                }

                var requiredControls = service.RequiredControls ?? [];
                if (requiredControls.Count > 0)
                {
                    sb.AppendLine($"  - Required Controls: {string.Join(", ", requiredControls)}");
                }

                var tags = service.Tags ?? [];
                if (tags.Count > 0)
                {
                    sb.AppendLine($"  - Tags: {string.Join(", ", tags)}");
                }
            }

            sb.AppendLine();
        }

        if (datastores.Count > 0)
        {
            sb.AppendLine("## Datastores");
            sb.AppendLine();

            foreach (var datastore in datastores.OrderBy(d => d.DatastoreName))
            {
                sb.AppendLine($"- **{datastore.DatastoreName}**");
                sb.AppendLine($"  - Type: {datastore.DatastoreType}");
                sb.AppendLine($"  - Platform: {datastore.RuntimePlatform}");

                if (!string.IsNullOrWhiteSpace(datastore.Purpose))
                {
                    sb.AppendLine($"  - Purpose: {datastore.Purpose}");
                }

                sb.AppendLine($"  - Private Endpoint Required: {(datastore.PrivateEndpointRequired ? "Yes" : "No")}");
                sb.AppendLine($"  - Encryption At Rest Required: {(datastore.EncryptionAtRestRequired ? "Yes" : "No")}");
            }

            sb.AppendLine();
        }

        if (relationships.Count > 0)
        {
            sb.AppendLine("## Relationships");
            sb.AppendLine();

            foreach (var relationship in relationships
                         .OrderBy(r => r.SourceId)
                         .ThenBy(r => r.TargetId))
            {
                sb.AppendLine($"- **{relationship.SourceId}** {FormatRelationship(relationship)} **{relationship.TargetId}**");

                if (!string.IsNullOrWhiteSpace(relationship.Description))
                {
                    sb.AppendLine($"  - {relationship.Description}");
                }
            }

            sb.AppendLine();
        }

        sb.AppendLine("## Governance");
        sb.AppendLine();

        var requiredControlsList = manifest.Governance?.RequiredControls ?? [];
        if (requiredControlsList.Count > 0)
        {
            sb.AppendLine($"- Required Controls: {string.Join(", ", requiredControlsList)}");
        }
        else
        {
            sb.AppendLine("- Required Controls: None recorded");
        }

        var complianceTags = manifest.Governance?.ComplianceTags ?? [];
        if (complianceTags.Count > 0)
        {
            sb.AppendLine($"- Compliance Tags: {string.Join(", ", complianceTags)}");
        }
        else
        {
            sb.AppendLine("- Compliance Tags: None recorded");
        }

        var policyConstraints = manifest.Governance?.PolicyConstraints ?? [];
        if (policyConstraints.Count > 0)
        {
            sb.AppendLine($"- Policy Constraints: {string.Join(", ", policyConstraints)}");
        }
        else
        {
            sb.AppendLine("- Policy Constraints: None recorded");
        }

        sb.AppendLine($"- Risk Classification: {manifest.Governance?.RiskClassification}");
        sb.AppendLine($"- Cost Classification: {manifest.Governance?.CostClassification}");
        sb.AppendLine();

        sb.AppendLine("## Metadata");
        sb.AppendLine();
        sb.AppendLine($"- Manifest Version: {manifest.Metadata?.ManifestVersion}");

        if (!string.IsNullOrWhiteSpace(manifest.Metadata?.ParentManifestVersion))
        {
            sb.AppendLine($"- Parent Manifest Version: {manifest.Metadata.ParentManifestVersion}");
        }

        if (!string.IsNullOrWhiteSpace(manifest.Metadata?.ChangeDescription))
        {
            sb.AppendLine($"- Change Description: {manifest.Metadata.ChangeDescription}");
        }

        if (manifest.Metadata is not null)
        {
            sb.AppendLine($"- Created UTC: {manifest.Metadata.CreatedUtc:O}");
        }

        var traceIds = manifest.Metadata?.DecisionTraceIds ?? [];
        if (traceIds.Count > 0)
        {
            sb.AppendLine($"- Decision Trace Count: {traceIds.Count}");
        }

        if (evidence is not null)
        {
            sb.AppendLine();
            sb.AppendLine("---");
            sb.AppendLine();
            sb.AppendLine(evidenceFormatter.FormatMarkdown(evidence).Trim());
            sb.AppendLine();
        }

        return sb.ToString();
    }

    /// <summary>
    /// Returns a prose-style label for a relationship (e.g. "reads from", "writes to").
    /// Intentionally uses fuller prose labels rather than the terse diagram labels in
    /// <see cref="ArchiForge.Application.Manifests.ManifestPresentation.RelationshipLabel"/>.
    /// </summary>
    private static string FormatRelationship(ManifestRelationship relationship)
    {
        return relationship.RelationshipType switch
        {
            RelationshipType.Calls => "calls",
            RelationshipType.ReadsFrom => "reads from",
            RelationshipType.WritesTo => "writes to",
            RelationshipType.PublishesTo => "publishes to",
            RelationshipType.SubscribesTo => "subscribes to",
            RelationshipType.AuthenticatesWith => "authenticates with",
            _ => relationship.RelationshipType.ToString()
        };
    }
}
