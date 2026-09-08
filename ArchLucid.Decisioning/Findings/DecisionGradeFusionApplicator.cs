using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Joins Decision-grade findings from distinct preferred engines that share a graph node (DX-51).
///     Constituent rows stay on the package; this applicator only appends synthesis rows.
/// </summary>
public static class DecisionGradeFusionApplicator
{
    public const string EngineType = "decision-grade-fusion";

    public const int MinClusterSize = 2;

    public const int MaxFusionFindings = 5;

    public static IReadOnlyList<Finding> Apply(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        if (findings.Count < MinClusterSize)
        {
            return [];
        }

        List<Finding> eligibleMembers = findings
            .Where(static finding => IsEligibleMember(finding))
            .ToList();

        if (eligibleMembers.Count < MinClusterSize)
        {
            return [];
        }

        List<FusionCluster> clusters = BuildClusters(eligibleMembers);

        if (clusters.Count == 0)
        {
            return [];
        }

        return clusters
            .OrderByDescending(static cluster => cluster.SourceEngineTypes.Count)
            .ThenByDescending(static cluster => cluster.SharedNodeIds.Count)
            .ThenBy(static cluster => cluster.ConstituentFindingIds[0], StringComparer.Ordinal)
            .Take(MaxFusionFindings)
            .Select(static cluster => BuildFusionFinding(cluster))
            .ToList();
    }

    internal static bool IsEligibleMember(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Classification != FindingClassification.DecisionGradeFinding)
        {
            return false;
        }

        if (string.Equals(finding.EngineType, EngineType, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(finding.EngineType))
        {
            return false;
        }

        if (!InsightDensityPreferredEngineTypes.IsPreferred(finding.EngineType))
        {
            return false;
        }

        return CollectNodeIds(finding).Count > 0;
    }

    private static List<FusionCluster> BuildClusters(IReadOnlyList<Finding> eligibleMembers)
    {
        Dictionary<string, List<Finding>> membersByNode = new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in eligibleMembers)
        {
            foreach (string nodeId in CollectNodeIds(finding))
            {
                if (!membersByNode.TryGetValue(nodeId, out List<Finding>? members))
                {
                    members = [];
                    membersByNode[nodeId] = members;
                }

                if (members.All(existing =>
                        !string.Equals(existing.FindingId, finding.FindingId, StringComparison.Ordinal)))
                {
                    members.Add(finding);
                }
            }
        }

        Dictionary<string, FusionCluster> clustersByMemberKey = new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, List<Finding>> pair in membersByNode)
        {
            List<Finding> members = pair.Value
                .OrderBy(static finding => finding.FindingId, StringComparer.Ordinal)
                .ToList();

            if (members.Count < MinClusterSize)
            {
                continue;
            }

            List<string> sourceEngineTypes = members
                .Select(static finding => finding.EngineType.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(static engineType => engineType, StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (sourceEngineTypes.Count < 2)
            {
                continue;
            }

            List<string> constituentFindingIds = members
                .Select(static finding => finding.FindingId)
                .ToList();
            string memberKey = string.Join('\u001f', constituentFindingIds);

            if (clustersByMemberKey.ContainsKey(memberKey))
            {
                continue;
            }

            List<string> sharedNodeIds = IntersectNodeIds(members);

            if (sharedNodeIds.Count == 0)
            {
                continue;
            }

            clustersByMemberKey[memberKey] = new FusionCluster(
                members,
                constituentFindingIds,
                sharedNodeIds,
                sourceEngineTypes);
        }

        return clustersByMemberKey.Values.ToList();
    }

    private static Finding BuildFusionFinding(FusionCluster cluster)
    {
        string sharedNodeLabel = cluster.SharedNodeIds[0];
        string title = "Joined: "
            + string.Join(" × ", cluster.SourceEngineTypes)
            + $" on {sharedNodeLabel}";

        List<string> descriptionLines = cluster.Members
            .Select(static member => $"- {member.FindingId}: {member.Title}")
            .ToList();

        List<string> evidenceRefs = cluster.Members
            .SelectMany(static member => member.EvidenceRefs ?? [])
            .Where(static evidenceRef => !string.IsNullOrWhiteSpace(evidenceRef))
            .Select(static evidenceRef => evidenceRef.Trim())
            .Where(static evidenceRef =>
                !evidenceRef.StartsWith("graph-node:", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        List<string> traceNotes = cluster.SharedNodeIds
            .Select(static nodeId => $"evidence:graph-node:{nodeId}")
            .Concat(cluster.ConstituentFindingIds.Select(static findingId => $"evidence:finding:{findingId}"))
            .ToList();

        return new Finding
        {
            FindingId = ComputeFindingId(cluster.ConstituentFindingIds),
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "DecisionGradeFusionFinding",
            Category = "Insight",
            EngineType = EngineType,
            Severity = FindingSeverity.Warning,
            Classification = FindingClassification.DecisionGradeFinding,
            Treatment = FindingTreatment.Promote,
            InsightDensityScore = 80,
            Title = title,
            Rationale = string.Join('\n', descriptionLines),
            DecisionConsequence =
                "Review the joined Decision-grade findings together; fusion does not add evidence beyond the constituents.",
            RelatedNodeIds = cluster.SharedNodeIds.ToList(),
            EvidenceRefs = evidenceRefs,
            PayloadType = nameof(DecisionGradeFusionFindingPayload),
            Payload = new DecisionGradeFusionFindingPayload
            {
                ConstituentFindingIds = cluster.ConstituentFindingIds,
                SharedNodeIds = cluster.SharedNodeIds,
                SourceEngineTypes = cluster.SourceEngineTypes,
            },
            Trace = new ExplainabilityTrace
            {
                RulesApplied = [EngineType],
                DecisionsTaken =
                [
                    $"Joined {cluster.Members.Count} Decision-grade findings from {cluster.SourceEngineTypes.Count} engines on shared node '{sharedNodeLabel}'.",
                ],
                Notes = traceNotes,
            },
            RecommendedActions =
            [
                "Review the constituent Decision-grade findings on the shared node as one decision.",
            ],
        };
    }

    private static string ComputeFindingId(IReadOnlyList<string> constituentFindingIds)
    {
        string composite = string.Join('|', constituentFindingIds);
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(composite));

        return Convert.ToHexString(hash)[..32].ToLowerInvariant();
    }

    private static List<string> CollectNodeIds(Finding finding)
    {
        if (finding.RelatedNodeIds is null || finding.RelatedNodeIds.Count == 0)
        {
            return [];
        }

        return finding.RelatedNodeIds
            .Where(static nodeId => !string.IsNullOrWhiteSpace(nodeId))
            .Select(static nodeId => nodeId.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static List<string> IntersectNodeIds(IReadOnlyList<Finding> members)
    {
        HashSet<string> intersection = new(CollectNodeIds(members[0]), StringComparer.OrdinalIgnoreCase);

        foreach (Finding member in members.Skip(1))
        {
            intersection.IntersectWith(CollectNodeIds(member));
        }

        return intersection
            .OrderBy(static nodeId => nodeId, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private sealed record FusionCluster(
        IReadOnlyList<Finding> Members,
        IReadOnlyList<string> ConstituentFindingIds,
        IReadOnlyList<string> SharedNodeIds,
        IReadOnlyList<string> SourceEngineTypes);
}
