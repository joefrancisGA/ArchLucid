using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Merge;

public sealed partial class AgentProposalManifestMerger
{
    private static void MergeRequiredControls(
        GoldenManifest manifest,
        IReadOnlyCollection<string> controls,
        DecisionMergeResult output,
        AgentType agentType)
    {
        // Seed from the existing list so the HashSet reflects any controls already on the manifest.
        HashSet<string> existingControls = new(manifest.Governance.RequiredControls, StringComparer.OrdinalIgnoreCase);

        // ReSharper disable once LoopCanBeConvertedToQuery — side effects (trace recording, list and HashSet mutation) prevent safe LINQ conversion.

        foreach (string control in controls)
        {

            if (string.IsNullOrWhiteSpace(control))
                continue;

            if (!existingControls.Add(control))
                continue;

            manifest.Governance.RequiredControls.Add(control);

            DecisionMergeTraceRecorder.AddTrace(
                output,
                manifest.RunId,
                "RequiredControlAdded",
                $"Added required control '{control}' from {agentType}.",
                new Dictionary<string, string> { ["control"] = control, ["agentType"] = agentType.ToString() });
        }
    }

    private static void MergeWarnings(
        DecisionMergeResult output,
        IReadOnlyCollection<string> warnings,
        AgentType agentType)
    {
        foreach (string warning in warnings)
        {

            if (string.IsNullOrWhiteSpace(warning))
                continue;

            output.Warnings.Add($"{agentType}: {warning}");
        }
    }

    private static void ApplyFindingsToGovernance(
        GoldenManifest manifest,
        AgentResult result,
        DecisionMergeResult output)
    {
        foreach (ArchitectureFinding finding in result.Findings)
        {
            if (!AgentArchitectureFindingEmissionGate.HasTypedEmission(finding))
                continue;

            GovernanceComplianceTagLiftPolicy.Apply(manifest, finding, result, output);

            DecisionMergeTraceRecorder.AddTrace(
                output,
                manifest.RunId,
                "FindingApplied",
                $"Applied finding from {result.AgentType}: {finding.Message}",
                new Dictionary<string, string>
                {
                    ["findingId"] = finding.FindingId,
                    ["agentType"] = result.AgentType.ToString(),
                    ["severity"] = finding.Severity.ToString(),
                    ["category"] = finding.Category
                });
        }
    }

    private static ManifestService CloneService(ManifestService source)
    {
        return new ManifestService
        {
            ServiceId =
                string.IsNullOrWhiteSpace(source.ServiceId) ? Guid.NewGuid().ToString("N") : source.ServiceId,
            ServiceName = source.ServiceName,
            ServiceType = source.ServiceType,
            RuntimePlatform = source.RuntimePlatform,
            Purpose = source.Purpose,
            Tags = source.Tags.ToList(),
            RequiredControls = source.RequiredControls.ToList()
        };
    }

    private static ManifestDatastore CloneDatastore(ManifestDatastore source)
    {
        return new ManifestDatastore
        {
            DatastoreId =
                string.IsNullOrWhiteSpace(source.DatastoreId) ? Guid.NewGuid().ToString("N") : source.DatastoreId,
            DatastoreName = source.DatastoreName,
            DatastoreType = source.DatastoreType,
            RuntimePlatform = source.RuntimePlatform,
            Purpose = source.Purpose,
            PrivateEndpointRequired = source.PrivateEndpointRequired,
            EncryptionAtRestRequired = source.EncryptionAtRestRequired
        };
    }

    private static ManifestRelationship CloneRelationship(ManifestRelationship source)
    {
        return new ManifestRelationship
        {
            RelationshipId =
                string.IsNullOrWhiteSpace(source.RelationshipId)
                    ? Guid.NewGuid().ToString("N")
                    : source.RelationshipId,
            SourceId = source.SourceId,
            TargetId = source.TargetId,
            RelationshipType = source.RelationshipType,
            Description = source.Description
        };
    }
}
