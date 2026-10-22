using System.Text.RegularExpressions;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Clusters demoted checklist findings into Decision-grade synthesis rows (DX-22).</summary>
public static partial class ChecklistClusterSynthesisApplicator
{
    public const string EngineType = "checklist-cluster-synthesis";

    public const int MinClusterSize = 3;

    public const int MaxSynthesisFindings = 5;

    public static IReadOnlyList<Finding> Apply(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        if (findings.Count == 0)
        {
            return [];
        }

        List<Finding> checklistMembers = findings
            .Where(static finding => finding.Classification == FindingClassification.ChecklistCoverage)
            .ToList();

        if (checklistMembers.Count < MinClusterSize)
        {
            return [];
        }

        Dictionary<string, List<Finding>> clusters = new(StringComparer.Ordinal);

        foreach (Finding finding in checklistMembers)
        {
            string clusterKey = ResolveClusterKey(finding);

            if (!clusters.TryGetValue(clusterKey, out List<Finding>? members))
            {
                members = [];
                clusters[clusterKey] = members;
            }

            members.Add(finding);
        }

        List<(string ClusterKey, List<Finding> Members)> eligibleClusters = clusters
            .Where(static pair => pair.Value.Count >= MinClusterSize)
            .Where(static pair => ClusterHasResolvableMemberEvidence(pair.Value))
            .Select(static pair => (pair.Key, pair.Value))
            .OrderByDescending(static pair => pair.Value.Count)
            .ThenBy(static pair => pair.Key, StringComparer.Ordinal)
            .Take(MaxSynthesisFindings)
            .ToList();

        if (eligibleClusters.Count == 0)
        {
            return [];
        }

        List<Finding> synthesisFindings = [];

        foreach ((string clusterKey, List<Finding> members) in eligibleClusters)
        {
            synthesisFindings.Add(BuildSynthesisFinding(clusterKey, members));
        }

        return synthesisFindings;
    }

    internal static string ResolveClusterKey(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
        {
            return $"policy:{finding.PolicyRuleId.Trim()}";
        }

        if (!string.IsNullOrWhiteSpace(finding.FindingType))
        {
            return $"type:{finding.FindingType.Trim()}";
        }

        return $"title:{NormalizeTitleStem(finding.Title)}";
    }

    internal static string NormalizeTitleStem(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return "unspecified-control";
        }

        string stem = QuotedSegmentRegex().Replace(title.Trim(), " ");
        stem = ResourceSuffixRegex().Replace(stem, " ");
        stem = TrailingPrepositionRegex().Replace(stem, " ");
        stem = CollapseWhitespaceRegex().Replace(stem, " ").Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(stem))
        {
            return "unspecified-control";
        }

        return stem;
    }

    private static bool ClusterHasResolvableMemberEvidence(IReadOnlyList<Finding> members)
    {
        foreach (Finding member in members)
        {
            if (GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(ExtractEvidenceRefs(member)))
            {
                return true;
            }
        }

        return false;
    }

    private static List<string> ExtractEvidenceRefs(Finding finding)
    {
        List<string> evidenceRefs = finding.Trace.Notes
            .Where(static note => note.StartsWith("evidence:", StringComparison.OrdinalIgnoreCase))
            .Select(static note => note["evidence:".Length..])
            .ToList();

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
        {
            evidenceRefs.Add($"policy-rule:{finding.PolicyRuleId.Trim()}");
        }

        return evidenceRefs;
    }

    private static Finding BuildSynthesisFinding(string clusterKey, IReadOnlyList<Finding> members)
    {
        List<string> evidenceNotes = members
            .Select(static member => $"evidence:finding:{member.FindingId}")
            .ToList();

        string controlLabel = ResolveControlLabel(clusterKey, members);
        int memberCount = members.Count;

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "ChecklistClusterSynthesisFinding",
            Category = "Insight",
            EngineType = EngineType,
            Severity = FindingSeverity.Warning,
            Classification = FindingClassification.DecisionGradeFinding,
            Treatment = FindingTreatment.Promote,
            InsightDensityScore = 80,
            Title = $"{controlLabel} missing on {memberCount} services",
            Rationale =
                $"{memberCount} demoted checklist findings share root cause '{clusterKey}'. One platform remediation may address the cluster.",
            DecisionConsequence =
                "Treat this as a single decision-grade control gap rather than unrelated checklist hygiene.",
            PayloadType = nameof(ChecklistClusterSynthesisFindingPayload),
            Payload = new ChecklistClusterSynthesisFindingPayload
            {
                MemberFindingIds = members.Select(static member => member.FindingId).ToList(),
                ClusterKey = clusterKey,
                MemberCount = memberCount,
            },
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["checklist-cluster-synthesis"],
                DecisionsTaken =
                [
                    $"Clustered {memberCount} ChecklistCoverage findings with key '{clusterKey}'.",
                ],
                Notes = evidenceNotes,
            },
            RecommendedActions =
            [
                "Review the clustered checklist findings and apply one shared remediation where the root cause matches.",
            ],
        };
    }

    private static string ResolveControlLabel(string clusterKey, IReadOnlyList<Finding> members)
    {
        if (clusterKey.StartsWith("policy:", StringComparison.Ordinal))
        {
            return clusterKey["policy:".Length..];
        }

        if (clusterKey.StartsWith("type:", StringComparison.Ordinal))
        {
            return clusterKey["type:".Length..];
        }

        if (clusterKey.StartsWith("title:", StringComparison.Ordinal))
        {
            string stem = clusterKey["title:".Length..];

            return ToSentenceCase(stem);
        }

        Finding representative = members[0];

        return string.IsNullOrWhiteSpace(representative.Title)
            ? "Shared control gap"
            : representative.Title;
    }

    private static string ToSentenceCase(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "Shared control gap";
        }

        if (value.Length == 1)
        {
            return value.ToUpperInvariant();
        }

        return char.ToUpperInvariant(value[0]) + value[1..];
    }

    [GeneratedRegex("'[^']*'|\"[^\"]*\"", RegexOptions.CultureInvariant)]
    private static partial Regex QuotedSegmentRegex();

    [GeneratedRegex(@"\b(on|for|at)\s+[\w-]+$", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex ResourceSuffixRegex();

    [GeneratedRegex(@"\b(on|for|at)\s*$", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex TrailingPrepositionRegex();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant)]
    private static partial Regex CollapseWhitespaceRegex();
}
